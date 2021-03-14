import { join } from 'path';

export const CDN_URL = 'https://linz-addr.kyle.kiwi';

export const outFolder = join(__dirname, '../../out');
export const suburbsFolder = join(outFolder, './suburbs');

const MAP = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

export const toLink = (osmId: string): string =>
  `https://osm.org/${MAP[osmId[0] as keyof typeof MAP]}/${osmId.slice(1)}`;
