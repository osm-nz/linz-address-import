import { processLinzData } from './processLinzData';
import { processOsmData } from './processOsmData';

async function main() {
  console.log('Starting preprocess...');

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
