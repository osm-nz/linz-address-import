import { processLinzData } from './processLinzData';
import { processOsmData } from './processOsmData';

export async function main(): Promise<void> {
  console.log('Starting preprocess...');

  console.time('osm');
  const osmData = await processOsmData();
  console.timeEnd('osm');

  console.time('linz');
  await processLinzData(osmData);
  console.timeEnd('linz');
}

if (process.env.NODE_ENV !== 'test') main();
