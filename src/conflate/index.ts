import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  type AddressId,
  CheckDate,
  type CoordKey,
  type CouldStackData,
  type DeletionData,
  type LinzData,
  type OSMData,
  type Overlapping,
  type ParcelToAddress,
  Status,
} from '../types.js';
import { getCoordKey } from '../common/geo.js';
import { processWithRef } from './processWithRef.js';
import { processWithoutRef } from './processWithoutRef.js';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses.js';
import { processDuplicates } from './processDuplicates.js';
import { processDeletions } from './processDeletions.js';
import { isCornerSection } from './isCornerSection.js';

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export async function main(): Promise<void> {
  const slow = !!mock || process.argv.includes('--full');
  console.log(
    slow
      ? '🚛 Running in --full mode. This will take significantly longer.'
      : '🚛 Running in standard mode. Use --full to run the full conflation (much slower).',
  );

  console.log('Reading LINZ data into memory...');
  const linzData: LinzData = JSON.parse(
    await fs.readFile(
      join(import.meta.dirname, `../../data/linz${mock}.json`),
      'utf8',
    ),
  );
  const { length } = Object.keys(linzData);

  const parcelToAddress: ParcelToAddress = {};
  for (const _addrId in linzData) {
    const addrId = <AddressId>_addrId;
    const { parcelId } = linzData[addrId];
    if (parcelId) {
      parcelToAddress[parcelId] ||= []; // cheaper than a set for 2 million instances
      parcelToAddress[parcelId].push(addrId);
    }
  }

  console.log('Reading OSM data into memory...');
  const osmData: OSMData = JSON.parse(
    await fs.readFile(
      join(import.meta.dirname, `../../data/osm${mock}.json`),
      'utf8',
    ),
  );

  console.log('Reading could-stack data into memory...');
  const couldBeStacked: CouldStackData = JSON.parse(
    await fs.readFile(
      join(import.meta.dirname, `../../data/linzCouldStack${mock}.json`),
      'utf8',
    ),
  );

  console.log('Computing which addresses to delete...');
  const deletionData: DeletionData = Object.entries(osmData.linz)
    .filter(
      ([linzId, osmAddr]) =>
        !(linzId in linzData) && // we delete every OSM node with a linzRef that does not exist in the LINZ data
        osmAddr.checked !== CheckDate.YesRecent, // ...unless it has a recent check_date
    )
    .map(([linzId, osmAddr]) => [
      <AddressId>linzId,
      osmAddr.suburb || 'deletions from unknown sector',
    ]);

  const statusReport: Record<
    Status,
    [linzId: AddressId, diagnostics: unknown][]
  > = {
    [Status.PERFECT]: [],
    [Status.EXISTS_BUT_WRONG_DATA]: [],
    [Status.EXISTS_BUT_NO_LINZ_REF]: [],
    [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: [],
    [Status.MULTIPLE_EXIST]: [],
    [Status.EXISTS_BUT_LOCATION_WRONG]: [],
    [Status.TOTALLY_MISSING]: [],
    [Status.NEEDS_DELETE]: [],
    [Status.NEEDS_DELETE_NON_TRIVIAL]: [],
    [Status.CORRUPT]: [],
    [Status.LINZ_REF_CHANGED]: [],
    [Status.COULD_BE_STACKED]: [],
    [Status.NEEDS_DELETE_ON_BUILDING]: [],
    [Status.REPLACED_BY_BUILDING]: [],
  };

  console.log('processing deleted data...');
  console.time('conflateDeletions');

  const [extraStatusReportSections, doNotCreate] = processDeletions(
    deletionData,
    osmData,
    linzData,
  );
  // this mutates statusReport
  Object.assign(statusReport, extraStatusReportSections);
  console.timeEnd('conflateDeletions');

  console.log('Identifying overlapping points...');
  const overlapping: Overlapping = {};
  for (const _linzRef in linzData) {
    const linzRef = <AddressId>_linzRef;
    const key = getCoordKey(linzData[linzRef].lat, linzData[linzRef].lng);
    overlapping[key] ||= 0;
    overlapping[key]++;
  }
  // slim down the object, to only keep points which are overlapping
  for (const _key in overlapping) {
    const key = <CoordKey>_key;
    if (overlapping[key] === 1) delete overlapping[key];
  }

  console.log('Processing data...');
  let index = 0;
  console.time('conflate');

  // see comments at `altRef`'s defintion
  for (const _mainRef in osmData.linz) {
    const mainRef = <AddressId>_mainRef;
    const altRef = osmData.linz[mainRef].altRef;
    if (altRef) doNotCreate.push(altRef);
  }

  // TODO: perf baseline: 300seconds
  for (const _linzId in linzData) {
    const linzId = <AddressId>_linzId;

    // skip this one if it's a LINZ_REF_CHANGED
    if (doNotCreate.includes(linzId)) continue;

    if (couldBeStacked[linzId]) {
      statusReport[Status.COULD_BE_STACKED].push([
        linzId,
        couldBeStacked[linzId],
      ]);
      continue;
    }

    const osmAddr = osmData.linz[linzId];
    const linzAddr = linzData[linzId];
    const linzAddrAlt = osmAddr?.altRef ? linzData[osmAddr.altRef] : undefined;
    const duplicate = osmData.duplicateLinzIds[linzId];
    const semi = osmData.semi[linzId];

    if (osmAddr) {
      const { status, diagnostics } = processWithRef(
        linzId,
        linzAddr,
        osmAddr,
        osmData.noRef,
        overlapping,
        slow,
        linzAddrAlt,
      );
      statusReport[status].push([linzId, diagnostics]);
    } else if (duplicate) {
      const { status, diagnostics } = processDuplicates(
        linzId,
        linzAddr,
        duplicate,
      );
      statusReport[status].push([linzId, diagnostics]);
    } else if (semi) {
      statusReport[Status.CORRUPT].push([linzId, [semi, linzAddr]]);
    } else {
      const possibleAddresses = findPotentialOsmAddresses(
        linzAddr,
        osmData.noRef,
      );

      const cornerSection = isCornerSection(
        linzId,
        linzAddr,
        linzData,
        parcelToAddress,
        osmData,
      );
      if (!possibleAddresses.length && cornerSection) {
        // the address doesn't exist in OSM, but there is a corner
        // section which we could merge this address into.
        statusReport[cornerSection.status].push([
          linzId,
          cornerSection.diagnostics,
        ]);
      }

      const { status, diagnostics } = processWithoutRef(
        linzId,
        linzAddr,
        possibleAddresses,
      );
      statusReport[status].push([linzId, diagnostics]);
    }

    index += 1;
    if (!(index % 1000)) {
      /* istanbul ignore next */
      process.stdout.write(`${((index / length) * 100).toFixed(1)}% `);
    }
  }

  console.timeEnd('conflate');

  await fs.writeFile(
    join(import.meta.dirname, `../../data/status${mock}.json`),
    JSON.stringify(statusReport, null, mock ? 2 : undefined),
  );
}

if (process.env.NODE_ENV !== 'test') main();
