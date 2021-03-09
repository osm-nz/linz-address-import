import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../types';
import { outFolder } from './util';
import { generateStats } from './generateStats';
import { handlers } from './handlers';

async function main() {
  console.log('Reading status file into memory...');
  const status: StatusReport = JSON.parse(
    await fs.readFile(join(__dirname, '../../data/status.json'), 'utf-8'),
  );

  console.log('Clearing output folder...');
  await fs.rmdir(outFolder, { recursive: true });
  await fs.mkdir(outFolder, { recursive: true });

  console.log('generating stats...');
  await generateStats(status);

  for (const $state in handlers) {
    const state = +$state as Status;
    console.log(`handling status ${Status[state]} ...`);
    handlers[+state as Status](status[state]);
  }
}
main();
