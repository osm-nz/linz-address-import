import { distanceBetween } from '../../../conflate/helpers/geo';
import { Coord, GeoJsonCoords, Tags } from '../../../types';
import { orthogonalize } from './orthogonalize';

const midpoint = ([lng1, lat1]: Coord, [lng2, lat2]: Coord): Coord => [
  (lng1 + lng2) / 2,
  (lat1 + lat2) / 2,
];

/**
 * LINZ maps airstrips as areas, which is apparently not acceptable in OSM,
 * even though iD has a preset for it.
 *
 * So we convert rectangular airstrip areas into a centreline, and add the
 * `width` tag
 */
export function transformAirstrip(
  areaGeom: GeoJsonCoords,
  tags: Tags,
): null | [GeoJsonCoords, Tags] {
  if (areaGeom.type !== 'Polygon') return [areaGeom, tags];
  if (areaGeom.coordinates.length !== 1) return [areaGeom, tags]; // we can't try to improve multipolygons

  let coords = areaGeom.coordinates[0];

  if (coords[0].join(',') !== coords.at(-1)!.join(',')) {
    return [areaGeom, tags]; // assert that it's a closed way
  }

  if (coords.length !== 5) {
    // not exactly reactangular. so lets try to orthogonalize it
    coords = orthogonalize(coords);
    if (coords.length !== 5) {
      // still not reactangular. so try orthogonalize it a second time
      coords = orthogonalize(coords);
      if (coords.length !== 5) {
        // still not reactangular. we're not going to try a third time.
        return [areaGeom, tags]; // give up and map this one as an area
      }
    }
  }

  const [A, B, C, D] = coords;

  // figure out long vs short edge
  // either A-B and C-D are short, or B-C and D-A are short

  const AB = distanceBetween(A[1], A[0], B[1], B[0]);
  const BC = distanceBetween(B[1], B[0], C[1], C[0]);
  const CD = distanceBetween(C[1], C[0], D[1], D[0]);
  const DA = distanceBetween(D[1], D[0], A[1], A[0]);

  // assert that AB-CD and BC-DA are similar length (within 300 metres)
  if (Math.abs(AB - CD) > 300 || Math.abs(BC - DA) > 300) {
    return [areaGeom, tags]; // it's not reactangular
  }

  const ABxCDavgLength = (AB + CD) / 2;
  const BCxDAavgLength = (BC + DA) / 2;

  const ABxCDIsShortSide = ABxCDavgLength < BCxDAavgLength;

  const pnt1 = ABxCDIsShortSide ? midpoint(A, B) : midpoint(B, C);
  const pnt2 = ABxCDIsShortSide ? midpoint(C, D) : midpoint(D, A);

  const lineGeom: GeoJsonCoords = {
    type: 'LineString',
    coordinates: [pnt1, pnt2],
  };
  const newTags: Tags = {
    ...tags,
    width: Math.round(
      ABxCDIsShortSide ? ABxCDavgLength : BCxDAavgLength,
    ).toString(),
  };
  delete newTags.area; // delete area=yes tag

  return [lineGeom, newTags];
}
