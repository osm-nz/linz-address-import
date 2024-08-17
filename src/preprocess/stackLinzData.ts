import { promises as fs, readFileSync } from 'node:fs';
import { join } from 'node:path';
import whichPolygon from 'which-polygon';
import type {
  CouldStackData,
  GeoJson,
  LinzAddr,
  LinzData,
  OSMData,
} from '../types.js';
import { toStackId, uniq } from '../common/index.js';
import { linzFile, linzTempFile, mock, osmFile, stackFile } from './const.js';
import { matchAlternativeAddrs } from './matchAlternativeAddrs.js';

const lowerStackTresholds: GeoJson<{ name: string; threshold: number }> =
  JSON.parse(
    readFileSync(
      join(import.meta.dirname, '../../static/lower-stack-threshold.geo.json'),
      'utf8',
    ),
  );

// the threshold was 11 until Feb 2023, when LINZ added 100k new addresses...
// in dense urban areas, this limit is further redued
// (see lower-stack-threshold.geo.json)
const STACK_THRESHOLD = mock ? 2 : 9;

const stackTresholdQuery = whichPolygon(lowerStackTresholds);

/** the object is keyed by a `houseKey` */
export type VisitedCoords = Record<
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
    if (a.$houseNumberMsb === a.housenumber) {
      // this is not a flat
      visitedNonFlats[houseKey] = linzId;
    } else {
      /** a uniq key to identify this *house* (which may have multiple flats) */
      visitedFlats[houseKey] ||= [];
      visitedFlats[houseKey].push([
        linzId,
        // round to nearest 0.05seconds of latitude/longitude in case the points are slightly off
        `${a.lat.toFixed(4)},${a.lng.toFixed(4)}` as `${number},${number}`,
      ]);
    }

    // ideally we would delete this prop, but it OOMs since it basically creates a clone of `out` in memory
    // delete out[linzId].$houseNumberMsb;
  }

  const alreadyInOsm = ([linzId]: VisitedCoords[string][number]) =>
    linzId in osmData.linz;

  for (const houseKey in visitedFlats) {
    const rawAddrIds = visitedFlats[houseKey]; // a list of all flats at this MSB house number
    const stackId = toStackId(rawAddrIds.map((x) => x[0]));
    const singleLinzId: string | undefined = visitedNonFlats[houseKey];

    const altAddresses = matchAlternativeAddrs(
      linzData,
      osmData,
      singleLinzId,
      rawAddrIds,
    );

    // if there are alternatives, filter out the duplicates
    const addrIds = altAddresses
      ? rawAddrIds.filter(([id]) => !altAddresses.addrIdsToSkip.has(id))
      : rawAddrIds;

    if (altAddresses) {
      for (const addrId in altAddresses.duplicateMap) {
        // delete the duplicate one, and add the duplicate's housenumber
        // as an alt to the main address.
        const otherId = altAddresses.duplicateMap[addrId];
        linzData[addrId].housenumberAlt = linzData[otherId].housenumber;
        delete linzData[otherId];
      }
    }

    const shouldBeUnstacked =
      osmData.linz[stackId]?.stackRequest === false ||
      osmData.linz[singleLinzId]?.stackRequest === false;

    const shouldBeStacked =
      osmData.linz[stackId]?.stackRequest ||
      osmData.linz[singleLinzId]?.stackRequest ||
      addrIds.some(([addrId]) => osmData.linz[addrId]?.stackRequest);

    /** check if any of the existing nodes (if any) have `linz:stack=no` */
    const shouldPreserveSeperateNodes = addrIds.some(
      ([addrId]) => osmData.linz[addrId]?.stackRequest === false,
    );

    // >2 because maybe someone got confused with the IDs and mapped a single one.
    const inOsm = addrIds.filter(alreadyInOsm);
    const alreadyMappedSeparatelyInOsm =
      inOsm.length > 2 &&
      inOsm.length + 1 > addrIds.length / 2 && // if more than half are mapped in OSM, keep it.
      // we add 1 in the equation above to handle the case where there are X already mapped,
      // and X+1 missing, where +1 is a single node for the whole apartment complex. In this case,
      // effectively half are mapped. That single node for the whole complex shouldn't be the
      // deciding factor when it comes to deleting a bunch of existing addresses.
      !(stackId in osmData.linz); // if it's mapped a stack, favour the stack over any number of addresses mapped separately

    const uniqLoc = addrIds.map(([, pos]) => pos).filter(uniq).length;

    /**
     * If number of uniq locations / number of flats. If < 0.9, then most addresses are in the same/similar place
     */
    const flatsMostlyStacked = uniqLoc / addrIds.length <= 0.5;

    const { lat, lng } = linzData[addrIds[0][0]];

    // use a custom stack threshold if there is one defined for this area
    const stackThreshold =
      stackTresholdQuery([lng, lat])?.threshold ?? STACK_THRESHOLD;

    if (
      (addrIds.length > stackThreshold && flatsMostlyStacked) ||
      shouldBeStacked
    ) {
      const housenumberMsb = houseKey.split('|')[0];

      if (shouldBeUnstacked) {
        // a mapper has requested that this stack be split up into separate addresses
        // so we do nothing.
      } else if (
        (alreadyMappedSeparatelyInOsm || shouldPreserveSeperateNodes) &&
        !shouldBeStacked
      ) {
        // the 2017 import generated a lot of these, so we won't suggest undoing all
        // that hard work. But we generate a diagnostic for them.
        for (const [linzId] of inOsm) {
          const a = linzData[linzId];
          const [inOsmL, totalL] = [inOsm.length, addrIds.length];
          couldBeStacked[linzId] = [
            osmData.linz[linzId].osmId,
            a.suburb[1],
            `${housenumberMsb} ${a.street}`,
            inOsmL === totalL
              ? inOsmL
              : (`${inOsmL}+${totalL - inOsmL}` as const),
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
        // we need to preserve linz:stack=yes, otherwise it will
        // be unstacked next time the script runs.
        if (shouldBeStacked) stackedAddr.isManualStackRequest = true;

        delete stackedAddr.level; // because the stack will have multiple levels merged together

        // delete the individual addresses
        for (const [linzId] of addrIds) delete linzData[linzId];

        if (singleLinzId) {
          // if we're creating a stack that would duplicate the property (see osm-nz/linz-address-import#8)
          // don't actually create the stack, but add the flatCount to the parent
          linzData[singleLinzId].flatCount = addrIds.length;
          delete linzData[singleLinzId].level; // because the stack will have multiple levels merged together
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
  const result = await mergeIntoStacks();
  console.log('saving new linz file...');
  await fs.writeFile(linzFile, JSON.stringify(result));
}

if (process.env.NODE_ENV !== 'test') main();
