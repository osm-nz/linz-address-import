import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { ConflateResult } from '@osm-conflation-engine/cli';
import { type HistoryFile, type StatsFile, Status } from '../types.js';
import { getReportCounts } from './report.js';
import { CDN_URL, mock, outFolder } from './helpers/index.js';

const STATS_FILE_NAME = 'stats.json';
const HISTORY_FILE_NAME = 'stats-history.json';

export const STATS_FILE = join(outFolder, STATS_FILE_NAME);
export const HISTORY_FILE = join(outFolder, HISTORY_FILE_NAME);

export async function generateStats(
  conflationResult: ConflateResult,
): Promise<void> {
  const count = getReportCounts();

  const total = Object.values(conflationResult.counts).reduce(
    (a, b) => a + b,
    0,
  );
  count[Status.PERFECT] = conflationResult.counts.perfect;
  count[Status.TOTALLY_MISSING] = conflationResult.counts.create;

  // mock the date in the test environment, otherwise the snapshot would update each time
  const date = mock ? 'MOCK' : new Date().toISOString();

  const stats: StatsFile = {
    date,
    count,
    total,
  };

  console.log('Fetching historic stats…');
  const historyFile: HistoryFile = mock
    ? { lastUpdated: '', rows: [] }
    : await fetch(`${CDN_URL}/${HISTORY_FILE_NAME}`).then(
        (r) => r.json() as Promise<HistoryFile>,
      );
  console.log('\tdone');

  // don't create a duplicate row. the date is in the row so this is safe
  const latestRow = historyFile.rows.at(-1);
  if (JSON.stringify(latestRow) === JSON.stringify(stats)) {
    console.log('No change in statistics, not updating table');
  } else {
    historyFile.rows.push(stats);
  }

  historyFile.lastUpdated = date;

  await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2));
  await fs.writeFile(HISTORY_FILE, JSON.stringify(historyFile));
}
