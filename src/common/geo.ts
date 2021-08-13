import { BBox } from '../types';

export function withinBBox(bbox: BBox, lat: number, lng: number): boolean {
  return (
    lat > bbox.minLat &&
    lat < bbox.maxLat &&
    lng > bbox.minLng &&
    lng < bbox.maxLng
  );
}
