import { join } from 'node:path';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const linzCsvFile = join(
  __dirname,
  mock ? '../__tests__/mock/linz-dump.csv' : '../../data/linz.csv',
);
export const ruralUrbanCsvFile = join(
  __dirname,
  mock
    ? '../__tests__/mock/linz-rural-urban-boundary.csv'
    : '../../data/rural-urban-boundary.csv',
);

export const osmFile = join(__dirname, `../../data/osm${mock}.json`);
export const linzTempFile = join(__dirname, `../../data/linzTemp${mock}.json`);
export const linzFile = join(__dirname, `../../data/linz${mock}.json`);
export const stackFile = join(
  __dirname,
  `../../data/linzCouldStack${mock}.json`,
);
export const ignoreFile = join(__dirname, `../../data/ignoreFile${mock}.json`);

/** more performant to lookup an object */
export type IgnoreFile = Record<string, 1>;
