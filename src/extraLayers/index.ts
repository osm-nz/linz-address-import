import { geodetic } from './geodetic/index.js';
import { linzTopo } from './linzTopo/index.js';

const extraLayers = <const>{ geodetic, linzTopo };

/** run misc. scripts to generate non-address datasets */
async function main() {
  if (process.env.NODE_ENV === 'test') {
    console.log('not running extraLayers code in the test environment');
    return;
  }

  const selection = process.argv[2];
  if (selection in extraLayers) {
    console.log('Running', selection);
    await extraLayers[selection as keyof typeof extraLayers]();
  } else {
    console.error(
      'You need to run `yarn extraLayers CMD` where CMD is one of:',
      Object.keys(extraLayers).join(', '),
      'You entered:',
      selection,
    );
    process.exit(1);
  }
}

main();
