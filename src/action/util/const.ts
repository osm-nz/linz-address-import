import { join } from 'node:path';

export const CDN_URL = 'https://osm-nz.github.io/linz-address-import';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const outFolder = join(
  import.meta.dirname,
  mock ? '../../__tests__/snapshot' : '../../../out',
);
export const suburbsFolder = join(outFolder, './suburbs');

export const MAP = <const>{
  n: 'node',
  w: 'way',
  r: 'relation',
};

export const toLink = (osmId: string): string =>
  `https://osm.org/${MAP[osmId[0] as keyof typeof MAP]}/${osmId.slice(1)}`;

export const MAX_ITEMS_PER_DATASET = +(
  process.env.MAX_ITEMS_PER_DATASET || 110
);
