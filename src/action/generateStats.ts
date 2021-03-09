import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../types';
import { outFolder } from './util';

export async function generateStats(data: StatusReport): Promise<void> {
  const count: Record<string, number> = {};

  for (const status in data) {
    count[Status[+status]] = data[+status as Status].length;
  }
  const total = Object.values(data).reduce((ac, t) => ac + t.length, 0);

  const stats = {
    date: new Date().toISOString(),
    count,
    total,
  };

  await fs.writeFile(
    join(outFolder, 'stats.json'),
    JSON.stringify(stats, null, 2),
  );
}
