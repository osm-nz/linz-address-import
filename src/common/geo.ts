import type { CoordKey } from '../types.js';

/**
 * converts a coordinate into a string key, for more performant
 * deduplication. 5dp = accurate to the nearest 1m, see
 * https://osm.wiki/Precision_of_coordinates
 */
export const getCoordKey = (lat: number, lon: number, accuraryDp = 5) =>
  <CoordKey>`${lat.toFixed(accuraryDp)},${lon.toFixed(accuraryDp)}`;
