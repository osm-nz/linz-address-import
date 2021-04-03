import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';
import { LinzSourceAddress, LinzData, LinzAddr, OSMData } from '../types';
import { toStackId } from '../common';

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

const STACK_THRESHOLD = mock ? 2 : 11;

const input = join(
  __dirname,
  mock ? '../__tests__/mock/linz-dump.csv' : '../../data/linz.csv',
);
const output = join(__dirname, `../../data/linz${mock}.json`);

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

function mergeIntoStacks(_linzData: LinzData, osmData: OSMData): LinzData {
  const linzData = _linzData;
  console.log('\nmerging some addresses into stacks...');
  const visited: VisitedCoords = {};

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
    const alreadyMappedSeparatelyInOsm =
      addrIds.filter(alreadyInOsm).length > 2;

    const uniqLoc = addrIds.map(([, pos]) => pos).filter(uniq).length;

    /**
     * If number of uniq locations / number of flats. If < 0.9, then most addresses are in the same/similar place
     */
    const flatsMostlyStacked = uniqLoc / addrIds.length <= 0.5;

    if (
      addrIds.length > STACK_THRESHOLD &&
      !alreadyMappedSeparatelyInOsm &&
      flatsMostlyStacked
    ) {
      // this address should be stacked.
      const [firstLinzId] = addrIds[0];

      const stackId = toStackId(addrIds.map((x) => x[0]));
      const stackedAddr: LinzAddr = {
        ...linzData[firstLinzId],
        housenumber: houseKey.split('|')[0], // replace `62A` or `Flat 1, 62` with `62`
      };

      // delete the individual addresses
      for (const [linzId] of addrIds) delete linzData[linzId];

      // add the stacked address
      linzData[stackId] = stackedAddr;
    }
  }

  // we basically need a second step - look thru every expanded stack ID from OSM, if the data is still in linzData
  // with it's original linz ID, delete it and add it to the stack ID that it's in in OSM. Very annoying

  return linzData;
}

// TODO: perf baseline is 50seconds
function linzToJson(): Promise<LinzData> {
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

export async function processLinzData(o: OSMData): Promise<void> {
  const res = await linzToJson().then((l) => mergeIntoStacks(l, o));
  await fs.writeFile(output, JSON.stringify(res));
}
