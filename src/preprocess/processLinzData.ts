import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';
import {
  LinzSourceAddress,
  LinzData,
  LinzAddr,
  OSMData,
  CouldStackData,
} from '../types';
import { toStackId } from '../common';
import { output as osmDataFile } from './processOsmData';

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

const STACK_THRESHOLD = mock ? 2 : 11;

const input = join(
  __dirname,
  mock ? '../__tests__/mock/linz-dump.csv' : '../../data/linz.csv',
);
const output = join(__dirname, `../../data/linz${mock}.json`);
const outputStack = join(__dirname, `../../data/linzCouldStack${mock}.json`);

function uniq<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

/** the object is keyed by a `houseKey` */
type VisitedCoords = Record<
  string,
  [linzId: string, pos: `${number},${number}`][]
>;

/** LINZ's longitude values go >180 e.g. 183deg which is invalid. It should be -177 */
const correctLng = (lng: number) => {
  // we could do `((lng + 180) % 360) - 180` but this is computationally cheaper
  if (lng < 180) return lng;
  return lng - 360;
};

async function mergeIntoStacks(_linzData: LinzData): Promise<LinzData> {
  console.log('\nreading OSM data into memory...');
  const osmData: OSMData = JSON.parse(await fs.readFile(osmDataFile, 'utf8'));

  console.log('merging some addresses into stacks...');
  const linzData = _linzData;
  const visited: VisitedCoords = {};
  const couldBeStacked: CouldStackData = {};

  for (const linzId in linzData) {
    const a = linzData[linzId];

    // if this is a flat
    if (a.$houseNumberMsb !== a.housenumber) {
      /** a uniq key to identify this *house* (which may have multiple flats) */
      const houseKey = `${a.$houseNumberMsb!}|${a.street}${a.suburb}`;
      visited[houseKey] ||= [];
      visited[houseKey].push([
        linzId,
        // round to nearest 0.05seconds of latitude/longitude in case the points are slightly off
        <`${number},${number}`>`${a.lat.toFixed(4)},${a.lng.toFixed(4)}`,
      ]);
    }

    // ideally we would delete this prop, but it OOMs since it basically creates a clone of `out` in memory
    // delete out[linzId].$houseNumberMsb;
  }

  const alreadyInOsm = ([linzId]: VisitedCoords[string][number]) =>
    linzId in osmData.linz;

  for (const houseKey in visited) {
    const addrIds = visited[houseKey]; // a list of all flats at this MSB house number

    // >2 because maybe someone got confused with the IDs and mapped a single one.
    const inOsm = addrIds.filter(alreadyInOsm);
    const alreadyMappedSeparatelyInOsm = inOsm.length > 2;

    const uniqLoc = addrIds.map(([, pos]) => pos).filter(uniq).length;

    /**
     * If number of uniq locations / number of flats. If < 0.9, then most addresses are in the same/similar place
     */
    const flatsMostlyStacked = uniqLoc / addrIds.length <= 0.5;

    if (addrIds.length > STACK_THRESHOLD && flatsMostlyStacked) {
      const housenumberMsb = houseKey.split('|')[0];

      if (alreadyMappedSeparatelyInOsm) {
        // the 2017 import generated a lot of these, so we won't suggest undoing all
        // that hard work. But we generate a diagnostic for them.
        for (const [linzId] of inOsm) {
          const a = linzData[linzId];
          const [inOsmL, totalL] = [inOsm.length, addrIds.length];
          couldBeStacked[linzId] = [
            osmData.linz[linzId].osmId,
            a.suburb[1],
            `${housenumberMsb} ${a.street}`,
            inOsmL === totalL ? inOsmL : <const>`${inOsmL}+${totalL - inOsmL}`,
          ];
        }
      } else {
        // this address should be stacked.
        const [firstLinzId] = addrIds[0];

        const stackId = toStackId(addrIds.map((x) => x[0]));
        const stackedAddr: LinzAddr = {
          ...linzData[firstLinzId],
          housenumber: housenumberMsb, // replace `62A` or `Flat 1, 62` with `62`
        };

        // delete the individual addresses
        for (const [linzId] of addrIds) delete linzData[linzId];

        // add the stacked address
        linzData[stackId] = stackedAddr;
      }
    }
  }

  await fs.writeFile(outputStack, JSON.stringify(couldBeStacked));

  return linzData;
}

// TODO: perf baseline is 50seconds
function linzToJson(): Promise<LinzData> {
  console.log('Starting preprocess of LINZ data...');
  return new Promise((resolve, reject) => {
    const out: LinzData = {};
    let i = 0;

    createReadStream(input)
      .pipe(csv())
      .on('data', (data: LinzSourceAddress) => {
        out[data.address_id] = {
          housenumber: data.full_address_number,
          $houseNumberMsb: data.address_number,
          street: data.full_road_name,
          suburb: [
            data.town_city ? 'U' : 'R',
            data.water_name || data.suburb_locality,
          ],
          town: data.town_city,
          lat: +data.shape_Y,
          lng: correctLng(+data.shape_X),
        };
        if (data.water_name) out[data.address_id].water = true;

        i += 1;
        if (!(i % 1000)) process.stdout.write('.');
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const res = await mergeIntoStacks(await linzToJson());
  await fs.writeFile(output, JSON.stringify(res));
}

if (process.env.NODE_ENV !== 'test') main();
