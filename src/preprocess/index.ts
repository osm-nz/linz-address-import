import { config as dotenv } from 'dotenv';
import { processLinzData } from './processLinzData';
import { processOsmData } from './processOsmData';
import { processDeletedData } from './processDeletedData';

dotenv();

export async function main(): Promise<void> {
  console.log('Starting preprocess...');

  console.time('deletions');
  await processDeletedData();
  console.timeEnd('deletions');

  console.time('osm');
  await processOsmData();
  console.timeEnd('osm');

  console.time('linz');
  await processLinzData();
  console.timeEnd('linz');
}

if (process.env.NODE_ENV !== 'test') main();
