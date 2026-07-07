import { promises as fs } from 'node:fs';
import type { DatasetId } from '@osm-conflation-engine/cli';
import type { CoordKey, LinzData, Overlapping } from '../types.js';
import { getCoordKey } from '../common/geo.js';
import { overlappingFile } from './const.js';

export async function findOverlapping(linzData: LinzData) {
  console.log('Identifying overlapping points...');
  const overlapping: Overlapping = {};
  for (const _linzRef in linzData) {
    const linzRef = <DatasetId>_linzRef;
    const key = getCoordKey(linzData[linzRef].lat, linzData[linzRef].lng);
    overlapping[key] ||= 0;
    overlapping[key]++;
  }

  // slim down the object, to only keep points which are overlapping
  for (const _key in overlapping) {
    const key = <CoordKey>_key;
    if (overlapping[key] === 1) {
      delete overlapping[key];
    }
  }

  await fs.writeFile(overlappingFile, JSON.stringify(overlapping));
}
