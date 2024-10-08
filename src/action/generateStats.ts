import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { type StatsFile, Status, type StatusReport } from '../types.js';
import { mock, outFolder } from './util/index.js';

export async function generateStats(data: StatusReport): Promise<void> {
  const count: Record<string, number> = {};

  for (const status in data) {
    count[Status[+status]] = data[+status as Status].length;
  }
  const total = Object.values(data).reduce((ac, t) => ac + t.length, 0);

  const stats: StatsFile = {
    // mock the date in the test environment, otherwise the snapshot would update each time
    date: mock ? 'MOCK' : new Date().toISOString(),
    count,
    total,
  };

  await fs.writeFile(
    join(outFolder, 'stats.json'),
    JSON.stringify(stats, null, 2),
  );
}
