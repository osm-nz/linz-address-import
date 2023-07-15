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

  /* eslint-disable unicorn/no-array-for-each -- deliberate */

  for (const f of features) {
    switch (f.geometry.type) {
      case 'Point': {
        visit(f.geometry.coordinates);

        break;
      }
      case 'LineString': {
        f.geometry.coordinates.forEach(visit);

        break;
      }
      case 'Polygon': {
        for (const ring of f.geometry.coordinates) ring.forEach(visit);

        break;
      }
      case 'MultiPolygon': {
        for (const member of f.geometry.coordinates) {
          for (const ring of member) ring.forEach(visit);
        }
        break;
      }
      default: {
        throw new Error('Unexpected geometry type');
      }
    }
  }
  return bbox;
}
