import { BBox } from '../../types';

export class ExtentRecorder {
  public bbox: BBox = {
    minLat: Infinity,
    minLng: Infinity,
    maxLat: -Infinity,
    maxLng: -Infinity,
  };

  visit(coords: { lat: number; lng: number }): void {
    const lat = +coords.lat;
    const lng = +coords.lng;
    if (lat < this.bbox.minLat) this.bbox.minLat = lat;
    if (lng < this.bbox.minLng) this.bbox.minLng = lng;
    if (lat > this.bbox.maxLat) this.bbox.maxLat = lat;
    if (lng > this.bbox.maxLng) this.bbox.maxLng = lng;
  }
}
