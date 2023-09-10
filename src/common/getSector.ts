import whichPolygon, { GeoJson } from 'which-polygon';
import { ChunkSize, Coords } from '../types';
import sectors from '../../static/sectors.geo.json';

const sectorQuery = whichPolygon(sectors as GeoJson<{ name: string }>);

// for size=small there are 67 possible rows, A-Z, AA-ZZ, AAA-ZZZ
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const ROWS = [
  ...LETTERS,
  ...LETTERS.map((X) => X + X),
  ...LETTERS.map((X) => X + X + X),
];

export function getSector({ lat, lng }: Coords, size: ChunkSize): string {
  // for Antarctica, chunk into datasets with ANT_SIZE features each
  if (lat < -63.929) {
    // the ross dependcy spans 360° of longitude and 25° of latitude (-65° to -90°)
    // so we create (90-65)/8 rows (letters) and 360/36 columns (numbers)
    // this means there'll be (25/8 * 360/36) sectors
    const row = ROWS[Math.floor(-lat / 8) * 8];
    const positiveLng = (lng + 360) % 360; // e.g. to convert -178° to 182°
    const column = Math.floor(positiveLng / 36) * 36;
    return `Sector ${row}${column}`;
  }

  if (lat > -33.92 || lat < -47.59 || lng < 164.75 || lng > 178.85) {
    if (lng > 0) return 'Outer Islands';
    return lat < -33 ? 'Chatham Is.' : 'Polynesia';
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
    const sector = sectorQuery([lng, lat]);
    return sector?.name || 'Unknown Sector';
  }

  /**
   * small = split NZ into 500 chunks, each roughly 1km²
   */
  if (size === 'small') {
    // the mainland spans 14 degrees of longitude (166-180) and 14 degrees of latitude (-34 to -48)
    // so we create 14*SCALE rows (numbers) and 14*SCALE columns (letters)
    // this means there'll be (14*SCALE)^2 sectors
    const SCALE = 4;
    const column = ROWS[Math.round(SCALE * (lng - 166))];
    const row = Math.round(SCALE * (-34 - lat));
    return `Sector ${column}${row}`;
  }

  return `Unknown ${size} Sector`;
}
