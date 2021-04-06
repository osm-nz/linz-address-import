import { promises as fs } from 'fs';
import { join } from 'path';
import {
  OSMData,
  LinzData,
  Status,
  DeletionData,
  CouldStackData,
} from '../types';
import { processWithRef } from './processWithRef';
import { processWithoutRef } from './processWithoutRef';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses';
import { processDuplicates } from './processDuplicates';
import { processDeletions } from './processDeletions';

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export async function main(): Promise<void> {
  console.log('Reading LINZ data into memory...');
  const linzData: LinzData = JSON.parse(
    await fs.readFile(join(__dirname, `../../data/linz${mock}.json`), 'utf-8'),
  );
  const { length } = Object.keys(linzData);

  console.log('Reading OSM data into memory...');
  const osmData: OSMData = JSON.parse(
    await fs.readFile(join(__dirname, `../../data/osm${mock}.json`), 'utf-8'),
  );

  console.log('Reading could-stack data into memory...');
  const couldBeStacked: CouldStackData = JSON.parse(
    await fs.readFile(
      join(__dirname, `../../data/linzCouldStack${mock}.json`),
      'utf-8',
    ),
  );

  console.log('Computing which addresses to delete...');
  const deletionData: DeletionData = Object.entries(osmData.linz)
    .filter(
      ([linzId, osmAddr]) =>
        !(linzId in linzData) && // we delete every OSM node with a linzRef that does not exist in the LINZ data
        // !linzId.startsWith('stack(') && // ...unless it is a stack
        !osmAddr.checked, // ...or it has a recent check_date
    )
    .map(([linzId, osmAddr]) => [
      linzId,
      osmAddr.suburb?.[1] || 'ZZ Deletions from unknown sector',
    ]);

  const statusReport: Record<
    Status,
    [linzId: string, diagnostics: unknown][]
  > = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    13: [],
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

  console.log('Processing data...');
  let i = 0;
  console.time('conflate');

  // TODO: perf baseline: 300seconds
  for (const linzId in linzData) {
    // skip this one if it's a LINZ_REF_CHANGED
    if (doNotCreate.includes(linzId)) continue; // eslint-disable-line no-continue

    if (couldBeStacked[linzId]) {
      statusReport[Status.COULD_BE_STACKED].push([
        linzId,
        couldBeStacked[linzId],
      ]);
      continue; // eslint-disable-line no-continue
    }

    const osmAddr = osmData.linz[linzId];
    const linzAddr = linzData[linzId];
    const duplicate = osmData.duplicateLinzIds[linzId];
    const semi = osmData.semi[linzId];

    if (osmAddr) {
      const { status, diagnostics } = processWithRef(linzId, linzAddr, osmAddr);
      statusReport[status].push([linzId, diagnostics]);

      delete osmData.linz[linzId]; // visited so we can get rid of it
    } else if (duplicate) {
      const { status, diagnostics } = processDuplicates(
        linzId,
        linzAddr,
        duplicate,
      );
      statusReport[status].push([linzId, diagnostics]);
    } else if (semi) {
      statusReport[Status.CORRUPT].push([linzId, semi]);
    } else {
      const possibleAddresses = findPotentialOsmAddresses(
        linzAddr,
        osmData.noRef,
      );
      const { status, diagnostics } = processWithoutRef(
        linzId,
        linzAddr,
        possibleAddresses,
      );
      statusReport[status].push([linzId, diagnostics]);
    }

    i += 1;
    if (!(i % 1000)) {
      /* istanbul ignore next */
      process.stdout.write(`${((i / length) * 100).toFixed(1)}% `);
    }
  }

  console.timeEnd('conflate');

  await fs.writeFile(
    join(__dirname, `../../data/status${mock}.json`),
    JSON.stringify(statusReport, null, mock ? 2 : undefined),
  );
}

if (process.env.NODE_ENV !== 'test') main();
