import { join } from 'path';

export const CDN_URL = 'https://linz-addr-cdn.kyle.kiwi';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const outFolder = join(
  __dirname,
  mock ? '../__tests__/snapshot' : '../../out',
);
export const suburbsFolder = join(outFolder, './suburbs');

const MAP = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

export const toLink = (osmId: string): string =>
  `https://osm.org/${MAP[osmId[0] as keyof typeof MAP]}/${osmId.slice(1)}`;
