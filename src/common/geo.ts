import type { BBox, Coord, CoordKey, GeoJsonCoords } from '../types.js';

export function withinBBox(bbox: BBox, lat: number, lng: number): boolean {
  return (
    lat > bbox.minLat &&
    lat < bbox.maxLat &&
    lng > bbox.minLng &&
    lng < bbox.maxLng
  );
}

export function getFirstCoord(geometry: GeoJsonCoords): Coord {
  let firstCoord = geometry.coordinates;
  while (typeof firstCoord[0] !== 'number') [firstCoord] = firstCoord;

  return firstCoord as Coord;
}

/**
 * converts a coordinate into a string key, for more performant
 * deduplication. 5dp = accurate to the nearest 1m, see
 * https://osm.wiki/Precision_of_coordinates
 */
export const getCoordKey = (lat: number, lon: number, accuraryDp = 5) =>
  <CoordKey>`${lat.toFixed(accuraryDp)},${lon.toFixed(accuraryDp)}`;
