import { BBox, Coord, GeoJsonCoords } from '../types';

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
