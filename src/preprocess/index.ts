import { config as dotenv } from 'dotenv';
import { processLinzData } from './processLinzData';
import { processOsmData } from './processOsmData';
import { processDeletedData } from './processDeletedData';

dotenv();

async function main() {
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

main().catch((ex) => {
  console.error(ex);
  process.exit(1);
});
