import { promises as fs } from 'fs';
import { join } from 'path';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { OsmAddr, OSMData, OsmId } from '../types';

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

const input = join(
  __dirname,
  mock ? '../__tests__/mock/planet.pbf' : '../../data/osm.pbf',
);
const output = join(__dirname, `../../data/osm${mock}.json`);

const MAP = { node: 'n', way: 'w', relation: 'r' };

/** checks if an ISO date exists and if it it's less than 1 year old */
const isChecked = (v: string | undefined) =>
  !!v && (+new Date() - +new Date(v)) / 1000 / 60 / 60 / 24 < 365;

// TODO: perf baseline is 87 seconds
function osmToJson(): Promise<OSMData> {
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
          const tags = Object.keys(item.tags);

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
              tags.includes('name') ||
              tags.includes('craft') ||
              tags.includes('shop'),
            checked: isChecked(item.tags.check_date),
          };
          if (isWater) obj.water = true;

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

export async function processOsmData(): Promise<OSMData> {
  const res = await osmToJson();
  await fs.writeFile(output, JSON.stringify(res));
  return res;
}
