import { geodetic } from './geodetic';

async function main() {
  if (process.env.NODE_ENV === 'test') {
    console.log('not running extraLayers code in the test environment');
    return;
  }

  // run misc. scripts to generate non-address datasets
  await geodetic();
}

main();
