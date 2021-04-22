import { Coords } from '../types';

type Sector =
  | 'Northland'
  | 'Auckland'
  | 'Central NI'
  | 'Lower NI'
  | 'Top of the South Island'
  | 'Canterbury / West Coast'
  | 'Southland / Otago / Stewart Is'
  | 'Antarctic'
  | 'Outer Islands';

export function getSector({ lat, lng }: Coords): Sector {
  if (lat < -63.929) return 'Antarctic';
  if (lat > -33.92 || lat < -47.59 || lng < 164.75 || lng > 178.85) {
    return 'Outer Islands';
  }
  if (lat < -45.04) return 'Southland / Otago / Stewart Is';
  if (lat < -42.68) return 'Canterbury / West Coast';
  if (lat < -40.22) {
    return lng < 174.44 ? 'Top of the South Island' : 'Lower NI';
  }
  if (lat < -37.24) return 'Central NI';
  if (lat < -35.97) return 'Auckland';
  return 'Northland';
}
