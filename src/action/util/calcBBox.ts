import { BBox, GeoJsonFeature } from '../../types';

export function calcBBox(features: GeoJsonFeature[]): BBox {
  const bbox: BBox = {
    minLat: Infinity,
    minLng: Infinity,
    maxLat: -Infinity,
    maxLng: -Infinity,
  };

  function visit([_lng, _lat]: [lng: string | number, lat: string | number]) {
    const lat = +_lat;
    const lng = +_lng;
    if (lat < bbox.minLat) bbox.minLat = lat;
    if (lng < bbox.minLng) bbox.minLng = lng;
    if (lat > bbox.maxLat) bbox.maxLat = lat;
    if (lng > bbox.maxLng) bbox.maxLng = lng;
  }

  for (const f of features) {
    if (f.geometry.type === 'Point') {
      visit(f.geometry.coordinates);
    } else if (f.geometry.type === 'LineString') {
      f.geometry.coordinates.forEach(visit);
    } else if (f.geometry.type === 'Polygon') {
      f.geometry.coordinates.forEach((ring) => ring.forEach(visit));
    }
  }
  return bbox;
}
