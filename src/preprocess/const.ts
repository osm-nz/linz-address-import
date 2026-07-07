import { join } from 'node:path';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const linzZipFile = join(
  import.meta.dirname,
  `../../data/linz${mock}.geo.jsonl.gz`,
);
export const linzCsvFile = join(
  import.meta.dirname,
  mock ? '../__tests__/mock/linz-dump.jsonl' : '../../data/linz.geo.jsonl',
);

export const planetFile = mock
  ? join(import.meta.dirname, '../__tests__/mock/planet.pbf')
  : 'https://download.geofabrik.de/australia-oceania/new-zealand-latest.osm.pbf';

export const linzTempFile = join(
  import.meta.dirname,
  `../../data/linzTemp${mock}.json`,
);
export const overlappingFile = join(
  import.meta.dirname,
  `../../data/overlapping${mock}.json`,
);
export const linzFile = join(
  import.meta.dirname,
  `../../data/linz-processed${mock}.geo.jsonl`,
);
export const stackFile = join(
  import.meta.dirname,
  `../../data/linzCouldStack${mock}.json`,
);
export const ignoreFile = join(
  import.meta.dirname,
  `../../data/ignoreFile${mock}.json`,
);
