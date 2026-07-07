import { parseArgs } from 'node:util';
import { entrypoint } from './entrypoint.js';

const { values } = parseArgs({
  args: process.argv,
  options: {
    steps: { type: 'string', short: 's' },
    cache: { type: 'boolean', short: 'c' },
  },
  allowPositionals: true,
});

await entrypoint({
  steps: <[]>values.steps?.split(','),
  use_cache: values.cache,
});
