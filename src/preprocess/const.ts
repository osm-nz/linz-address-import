import { join } from 'path';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const osmFile = join(__dirname, `../../data/osm${mock}.json`);
export const linzTempFile = join(__dirname, `../../data/linzTemp${mock}.json`);
export const linzFile = join(__dirname, `../../data/linz${mock}.json`);
export const stackFile = join(
  __dirname,
  `../../data/linzCouldStack${mock}.json`,
);
