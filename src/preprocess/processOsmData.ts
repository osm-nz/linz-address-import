import { promises as fs } from 'node:fs';
import pbf2json, { type Item } from 'pbf2json';
import through from 'through2';
import type { OsmFeature } from 'osm-api';
import { isChecked } from '../common/index.js';
import type { AddressId, OSMData, OsmAddr, OsmId } from '../types.js';
import { isImportUser } from '../common/accounts.js';
import { osmFile, planetFile } from './const.js';

const MAP = { node: 'n', way: 'w', relation: 'r' };

/** if a feature was last edited within this many DAYS, then it's "recently edited" */
const RECENT_THRESHOLD = 90;

const THRESHOLD_DATE = ((d) => {
  d.setDate(d.getDate() - RECENT_THRESHOLD);
  return +d / 1000;
})(new Date());

type PbfMetadata = Partial<
  Pick<OsmFeature, 'changeset' | 'version' | 'user'> & {
    timestamp?: number; // unlike the API, the golang code returns a number
  }
>;

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

    let anyMetadata = false;

    pbf2json
      .createReadStream({
        file: planetFile,
        tags: ['addr:housenumber+addr:street,ref:linz:address_id'], // (houseNumber & street) | linzId
        leveldb: '/tmp',
        // @ts-expect-error -- missing from typedefs since we
        //                     added this option in our fork.
        metadata: true,
      })
      .pipe(
        through.obj((item: Item, _, next) => {
          const type = MAP[item.type];

          const isWater = item.tags['addr:type'] === 'water';
          const suburbU = item.tags['addr:suburb'];
          const suburbR = item.tags['addr:hamlet'];
          const suburb = suburbU || suburbR;

          const coords = item.type === 'node' ? item : item.centroid;
          // @ts-expect-error -- missing from typedefs since we
          //                     added this option in our fork.
          const metadata: PbfMetadata | undefined = item.meta;

          if (metadata) anyMetadata = true;

          const object: OsmAddr = {
            osmId: (type + item.id) as OsmId,
            lat: +coords.lat,
            lng: +coords.lon,
            housenumber: item.tags['addr:housenumber'],
            housenumberAlt: item.tags['alt_addr:housenumber'],
            street: item.tags['addr:street'],
            streetAlt: item.tags['alt_addr:street'],
            suburb,
            town: item.tags['addr:city'],
            // this is an expensive check :(
            isNonTrivial:
              'name' in item.tags ||
              'craft' in item.tags ||
              'tourism' in item.tags ||
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
          if ((metadata?.timestamp ?? 0) > THRESHOLD_DATE) {
            object.recentlyChanged = true;
          }
          if (metadata?.version === 1 || isImportUser(metadata?.user)) {
            object.lastEditedByImporter = true;
          }
          if (isWater) object.water = true;
          if (suburbR) object.hasHamlet = true;
          if (suburbU && suburbR) object.doubleSuburb = true;
          if (item.tags['linz:stack'] === 'yes') object.stackRequest = true;
          if (item.tags['linz:stack'] === 'no') object.stackRequest = false;

          const linzId = <AddressId | undefined>(
            item.tags['ref:linz:address_id']
          );
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
            // unless the address has alt_addr:* tags.
            else if (linzId.includes(';')) {
              const mergedIds = <AddressId[]>linzId.split(';');
              if (
                (object.housenumberAlt || object.streetAlt) &&
                mergedIds.length === 2
              ) {
                // has alt_addr:* tags and has expect exactly 2 refs, so this
                // could be acceptable.
                out.linz[mergedIds[0]] = object;
                object.altRef = mergedIds[1];
              } else {
                // no alt_addr:* tags or length>2. Definitely not valid.
                for (const maybeLinzId of mergedIds) {
                  out.semi[maybeLinzId] = object;
                }
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
      .on('finish', () => {
        if (!anyMetadata) {
          console.warn('No metadata extracted from the planet file!');
        }
        resolve(out);
      })
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const result = await osmToJson();
  await fs.writeFile(osmFile, JSON.stringify(result));
}

if (process.env.NODE_ENV !== 'test') main();
