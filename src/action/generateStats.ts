import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { HistoryFile, StatsFile, Status, StatusReport } from '../types.js';
import { CDN_URL, mock, outFolder } from './util/index.js';

const STATS_FILE_NAME = 'stats.json';
const HISTORY_FILE_NAME = 'stats-history.json';

export const STATS_FILE = join(outFolder, STATS_FILE_NAME);
export const HISTORY_FILE = join(outFolder, HISTORY_FILE_NAME);

export async function generateStats(data: StatusReport): Promise<void> {
  const count = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [+k as Status, v.length]),
  );

  const total = Object.values(data).reduce((ac, t) => ac + t.length, 0);

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
