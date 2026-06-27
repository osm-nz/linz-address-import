import { latLngToCell } from 'h3-js';
import type { Coords } from '../types.js';

export function getSector({ lat, lng }: Coords): string {
  return latLngToCell(lat, lng, 3).replace(/f+$/, '');
}
