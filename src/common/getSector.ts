import { ChunkSize, Coords } from '../types';
import { sectors } from '../../static/sectors.json';
import { withinBBox } from './geo';

// for size=small there are 67 possible rows, A-Z, AA-ZZ, AAA-ZZZ
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ROWS = [
  ...LETTERS,
  ...LETTERS.map((X) => X + X),
  ...LETTERS.map((X) => X + X + X),
];

const ANT_SIZE = 50;

export function getSector(
  { lat, lng }: Coords,
  size: ChunkSize,
  index: number,
): string {
  // for Antarctica, chunk into datasets with ANT_SIZE features each
  if (lat < -63.929) {
    return `${Math.floor(index / ANT_SIZE) + 1}`.padStart(2, '0');
  }

  if (lat > -33.92 || lat < -47.59 || lng < 164.75 || lng > 178.85) {
    return 'Outer Islands';
  }

  /**
   * large = split NZ roughly into 7 regions
   */
  if (size === 'large') {
    if (lat < -45.04) return 'Southland / Otago / Stewart Is';
    if (lat < -42.68) return 'Canterbury / West Coast';
    if (lat < -40.22) {
      return lng < 174.44 ? 'Top of the South Island' : 'Greater Wellington';
    }
    if (lat < -37.24) return 'Central NI';
    if (lat < -35.97) return 'Auckland';
    return 'Northland';
  }

  /**
   * medium = split NZ into 33 smaller districts
   */
  if (size === 'medium') {
    for (const { name, bbox } of sectors) {
      if (withinBBox(bbox, lat, lng)) {
        return name;
      }
    }
  }

  /**
   * medium = split NZ into 500 chunks, each roughly 1km^2
   */
  if (size === 'small') {
    // the mainland spans 14 degrees of longitude (166-180) and 14 degrees of latitude (-34 to -48)
    // so we create 14*SCALE rows (numbers) and 14*SCALE columns (letters)
    // this means there'll be (14*SCALE)^2 sectors
    const SCALE = 1.75;
    const column = ROWS[Math.round(SCALE * (lng - 166))];
    const row = Math.round(SCALE * (-34 - lat));
    return `Sector ${column}${row}`;
  }

  return `Unknown ${size} Sector`;
}
