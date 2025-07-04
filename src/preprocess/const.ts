import { join } from 'node:path';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const linzCsvFile = join(
  import.meta.dirname,
  mock ? '../__tests__/mock/linz-dump.csv' : '../../data/linz.csv',
);
export const aimCsvFile = join(
  import.meta.dirname,
  mock ? '../__tests__/mock/aim-dump.csv' : '../../data/aim.csv',
);
export const ruralUrbanCsvFile = join(
  import.meta.dirname,
  mock
    ? '../__tests__/mock/linz-rural-urban-boundary.csv'
    : '../../data/rural-urban-boundary.csv',
);

export const planetFile = join(
  import.meta.dirname,
  mock ? '../__tests__/mock/planet.pbf' : '../../data/osm.pbf',
);
export const osmFile = join(import.meta.dirname, `../../data/osm${mock}.json`);
export const linzTempFile = join(
  import.meta.dirname,
  `../../data/linzTemp${mock}.json`,
);
export const linzFile = join(
  import.meta.dirname,
  `../../data/linz${mock}.json`,
);
export const stackFile = join(
  import.meta.dirname,
  `../../data/linzCouldStack${mock}.json`,
);
export const ignoreFile = join(
  import.meta.dirname,
  `../../data/ignoreFile${mock}.json`,
);

/** more performant to lookup an object */
export type IgnoreFile = Record<string, 1>;
