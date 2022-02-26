import { promises as fs } from 'fs';
import { join } from 'path';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { OsmAddr, OSMData, OsmId } from '../types';
import { mock, osmFile } from './const';

const input = join(
  __dirname,
  mock ? '../__tests__/mock/planet.pbf' : '../../data/osm.pbf',
);

const MAP = { node: 'n', way: 'w', relation: 'r' };

/** checks if an ISO date exists and if it it's less than 1 year old */
const isChecked = (v: string | undefined) =>
  !!v && (+new Date() - +new Date(v)) / 1000 / 60 / 60 / 24 < 365;

// TODO: perf baseline is 87 seconds
function osmToJson(): Promise<OSMData> {
  console.log('Starting preprocess of OSM data...');
  return new Promise<OSMData>((resolve, reject) => {
    const out: OSMData = {
      linz: {},
      noRef: [],
      duplicateLinzIds: {},
      semi: {},
    };
    let i = 0;

    pbf2json
      .createReadStream({
        file: input,
        tags: ['addr:housenumber+addr:street,ref:linz:address_id'], // (houseNumber & street) | linzId
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _e, next) => {
          const type = MAP[item.type];

          const isWater = item.tags['addr:type'] === 'water';
          const suburbU = item.tags['addr:suburb'];
          const suburbR = item.tags['addr:hamlet'];
          const suburb = suburbU || suburbR;

          const coords = item.type === 'node' ? item : item.centroid;

          const obj: OsmAddr = {
            osmId: (type + item.id) as OsmId,
            lat: +coords.lat,
            lng: +coords.lon,
            housenumber: item.tags['addr:housenumber'],
            street: item.tags['addr:street'],
            suburb: suburb ? [suburbU ? 'U' : 'R', suburb] : undefined,
            // this is an expensive check :(
            isNonTrivial:
              'name' in item.tags ||
              'craft' in item.tags ||
              'shop' in item.tags,
            checked: isChecked(item.tags.check_date),
            // safe to use || instead of ?? because the tag value will never be 0
            flatCount:
              // if the OSM tag has building:flats=0, we pretend it's -1 (since neither is valid anyway)
              'building:flats' in item.tags
                ? +item.tags['building:flats']! || -1
                : undefined,
          };
          if (isWater) obj.water = true;
          if (suburbU && suburbR) obj.doubleSuburb = true;

          const linzId = item.tags['ref:linz:address_id'];
          if (linzId) {
            // check if there is already an OSM object with the same linz ID

            // this node is 3rd+ one with this linzId
            if (out.duplicateLinzIds[linzId]) {
              out.duplicateLinzIds[linzId].push(obj);
            }

            // this node is 2nd one with this linzId
            else if (out.linz[linzId]) {
              out.duplicateLinzIds[linzId] = [out.linz[linzId], obj];
              delete out.linz[linzId];
            }

            // the linz id has a semicolon in it - we don't like this
            else if (linzId.includes(';')) {
              for (const maybeLinzId of linzId.split(';')) {
                out.semi[maybeLinzId] = obj;
              }
            }

            // not a duplicate
            else {
              out.linz[linzId] = obj;
            }
          } else {
            // there's no linzRef - let's check if this is a building
            if ('building' in item.tags) obj.isUnRefedBuilding = true;

            out.noRef.push(obj);
          }

          i += 1;
          if (!(i % 1000)) process.stdout.write('.');

          next();
        }),
      )
      .on('finish', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const res = await osmToJson();
  await fs.writeFile(osmFile, JSON.stringify(res));
}

if (process.env.NODE_ENV !== 'test') main();
