import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import pbf2json, { type Item } from 'pbf2json';
import through from 'through2';
import { isChecked } from '../common/index.js';
import type { OSMData, OsmAddr, OsmId } from '../types.js';
import { mock, osmFile } from './const.js';

const input = join(
  __dirname,
  mock ? '../__tests__/mock/planet.pbf' : '../../data/osm.pbf',
);

const MAP = { node: 'n', way: 'w', relation: 'r' };

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
    let index = 0;

    pbf2json
      .createReadStream({
        file: input,
        tags: ['addr:housenumber+addr:street,ref:linz:address_id'], // (houseNumber & street) | linzId
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _, next) => {
          const type = MAP[item.type];

          const isWater = item.tags['addr:type'] === 'water';
          const suburbU = item.tags['addr:suburb'];
          const suburbR = item.tags['addr:hamlet'];
          const suburb = suburbU || suburbR;

          const coords = item.type === 'node' ? item : item.centroid;

          const object: OsmAddr = {
            osmId: (type + item.id) as OsmId,
            lat: +coords.lat,
            lng: +coords.lon,
            housenumber: item.tags['addr:housenumber'],
            housenumberAlt: item.tags['alt_addr:housenumber'],
            street: item.tags['addr:street'],
            suburb: suburb ? [suburbU ? 'U' : 'R', suburb] : undefined,
            town: item.tags['addr:city'],
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
            level: item.tags.level,
          };
          if (isWater) object.water = true;
          if (suburbU && suburbR) object.doubleSuburb = true;
          if (item.tags['linz:stack'] === 'yes') object.stackRequest = true;
          if (item.tags['linz:stack'] === 'no') object.stackRequest = false;

          const linzId = item.tags['ref:linz:address_id'];
          if (linzId) {
            // check if there is already an OSM object with the same linz ID

            // this node is 3rd+ one with this linzId
            if (out.duplicateLinzIds[linzId]) {
              out.duplicateLinzIds[linzId].push(object);
            }

            // this node is 2nd one with this linzId
            else if (out.linz[linzId]) {
              out.duplicateLinzIds[linzId] = [out.linz[linzId], object];
              delete out.linz[linzId];
            }

            // the linz id has a semicolon in it - we don't like this
            else if (linzId.includes(';')) {
              for (const maybeLinzId of linzId.split(';')) {
                out.semi[maybeLinzId] = object;
              }
            }

            // not a duplicate
            else {
              out.linz[linzId] = object;
            }
          } else {
            // there's no linzRef - let's check if this is a building
            if ('building' in item.tags) object.isUnRefedBuilding = true;

            out.noRef.push(object);
          }

          index += 1;
          if (!(index % 1000)) process.stdout.write('.');

          next();
        }),
      )
      .on('finish', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const result = await osmToJson();
  await fs.writeFile(osmFile, JSON.stringify(result));
}

if (process.env.NODE_ENV !== 'test') main();
