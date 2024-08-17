import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  CheckDate,
  type CouldStackData,
  type DeletionData,
  type LinzData,
  type OSMData,
  Status,
} from '../types.js';
import { processWithRef } from './processWithRef.js';
import { processWithoutRef } from './processWithoutRef.js';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses.js';
import { processDuplicates } from './processDuplicates.js';
import { processDeletions } from './processDeletions.js';

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
      linzId,
      osmAddr.suburb?.[1] || 'deletions from unknown sector',
    ]);

  const statusReport: Record<Status, [linzId: string, diagnostics: unknown][]> =
    {
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
      14: [],
      15: [],
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
  let index = 0;
  console.time('conflate');

  // TODO: perf baseline: 300seconds
  for (const linzId in linzData) {
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
    const duplicate = osmData.duplicateLinzIds[linzId];
    const semi = osmData.semi[linzId];

    if (osmAddr) {
      const { status, diagnostics } = processWithRef(
        linzId,
        linzAddr,
        osmAddr,
        osmData.noRef,
        slow,
      );
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
      statusReport[Status.CORRUPT].push([linzId, [semi, linzAddr]]);
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
