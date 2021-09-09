import { Coords } from '../types';
import { sectors } from '../../static/sectors.json';
import { withinBBox } from './geo';

export function getSector({ lat, lng }: Coords): string {
  if (lat < -63.929) return 'Antarctic';
  if (lat > -33.92 || lat < -47.59 || lng < 164.75 || lng > 178.85) {
    return 'Outer Islands';
  }

  for (const { name, bbox } of sectors) {
    if (withinBBox(bbox, lat, lng)) {
      return name;
    }
  }

  return 'Unknown Sector';
}
