import { promises as fs } from 'node:fs';
import { getResolution, latLngToCell } from 'h3-js';
import {
  type DatasetId,
  type OsmFeature,
  getTempFileNames,
  readJsonL,
  writeJsonL,
} from '@osm-conflation-engine/cli';
import type { Feature } from 'geojson';
import type {
  AddressId,
  CoordKey,
  CouldStackData,
  LinzAddr,
  LinzData,
} from '../types.js';
import { getCoordKey, toStackId, uniq } from '../common/index.js';
import { REF_TAG, config } from '../config.js';
import { handleCouldBeStacked } from '../conflate/handleCouldBeStacked.js';
import { linzFile, linzTempFile, mock, stackFile } from './const.js';
import { matchAlternativeAddrs } from './matchAlternativeAddrs.js';
import { findOverlapping } from './findOverlapping.js';

// the threshold was 11 until Feb 2023, when LINZ added 100k new addresses...
// in dense urban areas, this limit is further redued
const STACK_THRESHOLD = mock ? 2 : 9;
const LOWER_STACK_THRESHOLD: Record<string, number> = {
  // lookup these IDs using https://h3geo.org/#hex=…
  '87bb50005ffffff': 5, // NZ-Auckland CBD
  '87bb2955affffff': 5, // NZ-Wellington CBD
  '87da94b41ffffff': 5, // NZ-Christchurch CBD
};
const LOWER_STACK_THRESHOLD_RES = 7;

// sanity check
for (const value of Object.keys(LOWER_STACK_THRESHOLD)) {
  if (getResolution(value) !== LOWER_STACK_THRESHOLD_RES) {
    throw new Error(`${value} must be resolution ${LOWER_STACK_THRESHOLD_RES}`);
  }
}

/** the object is keyed by a `houseKey` */
export type VisitedCoords = Record<
  string,
  //
  [linzId: AddressId, pos: CoordKey][]
>;

async function mergeIntoStacks(): Promise<LinzData> {
  console.log('reading OSM data into memory...');
  const { tempFileNames } = await getTempFileNames(config);
  const osmData = await readJsonL<OsmFeature, DatasetId>(
    tempFileNames.osm_processed_with_ref,
    (row) => <DatasetId>row.tags[REF_TAG],
  );

  console.log('reading LINZ data into memory...');
  const linzData: LinzData = JSON.parse(
    await fs.readFile(linzTempFile, 'utf8'),
  );

  console.log('merging some addresses into stacks...');
  const visitedFlats: VisitedCoords = {};
  const visitedNonFlats: Record<string, AddressId> = {};
  const couldBeStacked: CouldStackData = {};

  for (const _linzId in linzData) {
    const linzId = <AddressId>_linzId;
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
        getCoordKey(a.lat, a.lng, 4),
      ]);
    }

    // ideally we would delete this prop, but it OOMs since it basically creates a clone of `out` in memory
    // delete out[linzId].$houseNumberMsb;
  }

  const alreadyInOsm = ([linzId]: VisitedCoords[string][number]) =>
    linzId in osmData;

  for (const houseKey in visitedFlats) {
    const rawAddrIds = visitedFlats[houseKey]; // a list of all flats at this MSB house number
    const stackId = toStackId(rawAddrIds.map((x) => x[0]));
    const singleLinzId = visitedNonFlats[houseKey];

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
      for (const _addrId in altAddresses.duplicateMap) {
        const addrId = <AddressId>_addrId;
        // delete the duplicate one, and add the duplicate's housenumber
        // as an alt to the main address.
        const otherId = altAddresses.duplicateMap[addrId];
        linzData[addrId].housenumberAlt = linzData[otherId].housenumber;
        delete linzData[otherId];
      }
    }

    const shouldBeUnstacked =
      osmData[stackId]?.tags['linz:stack'] === 'no' ||
      osmData[singleLinzId]?.tags['linz:stack'] === 'no';

    const shouldBeStacked =
      osmData[stackId]?.tags['linz:stack'] === 'yes' ||
      osmData[singleLinzId]?.tags['linz:stack'] === 'yes' ||
      addrIds.some(([addrId]) => osmData[addrId]?.tags['linz:stack'] === 'yes');

    /** check if any of the existing nodes (if any) have `linz:stack=no` */
    const shouldPreserveSeperateNodes = addrIds.some(
      ([addrId]) => osmData[addrId]?.tags['linz:stack'] === 'no',
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
      !(stackId in osmData); // if it's mapped a stack, favour the stack over any number of addresses mapped separately

    const uniqLoc = addrIds.map(([, pos]) => pos).filter(uniq).length;

    /**
     * If number of uniq locations / number of flats. If < 0.9, then most addresses are in the same/similar place
     */
    const flatsMostlyStacked = uniqLoc / addrIds.length <= 0.5;

    const { lat, lng } = linzData[addrIds[0][0]];

    // use a custom stack threshold if there is one defined for this area
    const stackThreshold =
      LOWER_STACK_THRESHOLD[
        latLngToCell(lat, lng, LOWER_STACK_THRESHOLD_RES)
      ] ?? STACK_THRESHOLD;

    if (
      (addrIds.length > stackThreshold && flatsMostlyStacked) ||
      shouldBeStacked
    ) {
      const housenumberMsb = houseKey.split('|', 1)[0];

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
            osmData[linzId].id,
            a.suburb,
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
          id: stackId,
        };
        // we need to preserve linz:stack=yes, otherwise it will
        // be unstacked next time the script runs.
        if (shouldBeStacked) stackedAddr.isManualStackRequest = true;

        // delete the individual addresses
        for (const [linzId] of addrIds) delete linzData[linzId];

        if (singleLinzId) {
          // if we're creating a stack that would duplicate the property (see osm-nz/linz-address-import#8)
          // don't actually create the stack, but add the flatCount to the parent
          linzData[singleLinzId].flatCount = addrIds.length;
        } else {
          // add the stacked address
          linzData[stackId] = stackedAddr;
        }
      }
    }
  }

  await fs.writeFile(stackFile, JSON.stringify(couldBeStacked));
  await handleCouldBeStacked(couldBeStacked);

  return linzData;
}

export async function main(): Promise<void> {
  const result = await mergeIntoStacks();
  await findOverlapping(result);
  console.log('saving new linz file...');
  const jsonl = Object.values(result).map(
    (row): Feature => ({
      type: 'Feature',
      id: row.id,
      geometry: {
        type: 'Point',
        coordinates: [row.lng, row.lat],
      },
      properties: row,
    }),
  );
  await writeJsonL(linzFile, jsonl);
}

if (process.env.NODE_ENV !== 'test') main();
