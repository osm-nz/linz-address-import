import { promises as fs } from 'fs';
import { LinzData, LinzAddr, OSMData, CouldStackData } from '../types';
import { toStackId } from '../common';
import { linzFile, linzTempFile, mock, osmFile, stackFile } from './const';

const STACK_THRESHOLD = mock ? 2 : 11;

function uniq<T>(value: T, index: number, self: T[]) {
  return self.indexOf(value) === index;
}

/** the object is keyed by a `houseKey` */
type VisitedCoords = Record<
  string,
  [linzId: string, pos: `${number},${number}`][]
>;

async function mergeIntoStacks(): Promise<LinzData> {
  console.log('reading OSM data into memory...');
  const osmData: OSMData = JSON.parse(await fs.readFile(osmFile, 'utf8'));
  console.log('reading LINZ data into memory...');
  const linzData: LinzData = JSON.parse(
    await fs.readFile(linzTempFile, 'utf8'),
  );

  console.log('merging some addresses into stacks...');
  const visitedFlats: VisitedCoords = {};
  const visitedNonFlats: Record<string, string> = {};
  const couldBeStacked: CouldStackData = {};

  for (const linzId in linzData) {
    const a = linzData[linzId];

    const houseKey = `${a.$houseNumberMsb!}|${a.street}${a.suburb}`;

    // if this is a flat
    if (a.$houseNumberMsb !== a.housenumber) {
      /** a uniq key to identify this *house* (which may have multiple flats) */
      visitedFlats[houseKey] ||= [];
      visitedFlats[houseKey].push([
        linzId,
        // round to nearest 0.05seconds of latitude/longitude in case the points are slightly off
        <`${number},${number}`>`${a.lat.toFixed(4)},${a.lng.toFixed(4)}`,
      ]);
    } else {
      // this is not a flat
      visitedNonFlats[houseKey] = linzId;
    }

    // ideally we would delete this prop, but it OOMs since it basically creates a clone of `out` in memory
    // delete out[linzId].$houseNumberMsb;
  }

  const alreadyInOsm = ([linzId]: VisitedCoords[string][number]) =>
    linzId in osmData.linz;

  for (const houseKey in visitedFlats) {
    const addrIds = visitedFlats[houseKey]; // a list of all flats at this MSB house number
    const stackId = toStackId(addrIds.map((x) => x[0]));

    // >2 because maybe someone got confused with the IDs and mapped a single one.
    const inOsm = addrIds.filter(alreadyInOsm);
    const alreadyMappedSeparatelyInOsm =
      inOsm.length > 2 &&
      inOsm.length > addrIds.length / 2 && // if more than half are mapped in OSM, keep it
      !(stackId in osmData.linz); // if it's mapped a stack, favour the stack over any number of addresses mapped separately

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

        const stackedAddr: LinzAddr = {
          ...linzData[firstLinzId],
          housenumber: housenumberMsb, // replace `62A` or `Flat 1, 62` with `62`
          flatCount: addrIds.length,
        };

        // delete the individual addresses
        for (const [linzId] of addrIds) delete linzData[linzId];

        if (houseKey in visitedNonFlats) {
          // if we're creating a stack that would duplicate the property (see osm-nz/linz-address-import#8)
          // don't actually create the stack, but add the flatCount to the parent
          const singleLinzId = visitedNonFlats[houseKey];
          linzData[singleLinzId].flatCount = addrIds.length;
        } else {
          // add the stacked address
          linzData[stackId] = stackedAddr;
        }
      }
    }
  }

  await fs.writeFile(stackFile, JSON.stringify(couldBeStacked));

  return linzData;
}

export async function main(): Promise<void> {
  const res = await mergeIntoStacks();
  console.log('saving new linz file...');
  await fs.writeFile(linzFile, JSON.stringify(res));
}

if (process.env.NODE_ENV !== 'test') main();
