import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../types';
import { outFolder, mock } from './util';
import { generateStats } from './generateStats';
import { handlers } from './handlers';

export async function main(): Promise<void> {
  console.log('Reading status file into memory...');
  const status: StatusReport = JSON.parse(
    await fs.readFile(
      join(__dirname, `../../data/status${mock}.json`),
      'utf-8',
    ),
  );

  console.log('Clearing output folder...');
  await fs.rmdir(outFolder, { recursive: true });
  await fs.mkdir(outFolder, { recursive: true });

  console.log('generating stats...');
  await generateStats(status);

  for (const $state in handlers) {
    const state = +$state as Status;
    console.log(`handling status ${Status[state]} ...`);
    // always pass in NEEDS_DELETE data for handlers that need it
    await handlers[+state as Status](
      status[state],
      status[Status.NEEDS_DELETE],
    );
  }
}

if (process.env.NODE_ENV !== 'test') main();
