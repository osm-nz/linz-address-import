import { join } from 'node:path';

export const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

export const outFolder = join(
  import.meta.dirname,
  mock ? '../../__tests__/snapshot' : '../../../out',
);
export const suburbsFolder = join(outFolder, './suburbs');

export const LAYER_PREFIX = 'Address Update';
