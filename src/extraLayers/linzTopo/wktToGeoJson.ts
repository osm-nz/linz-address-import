import { GeoJsonCoords } from '../../types';

const TYPES = <const>{
  POINT: 'Point',
  LINESTRING: 'LineString',
  POLYGON: 'Polygon',
  MULTIPOLYGON: 'MultiPolygon',
};
/**
 * Converts {@link https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry WKT} to geojson
 */
export const wktToGeoJson = (wkt: string): GeoJsonCoords => {
  let type = TYPES[wkt.match(/^\w+/)![0] as keyof typeof TYPES];

  let coordinates = JSON.parse(
    wkt
      .replace(/^\w+ /, '')
      .replace(/\(/g, '[')
      .replace(/\)/g, ']')
      .replace(
        /((\d|\.|-)+) ((\d|\.|-)+)/g, // matches `174.123 -36.456`
        (_0, lng, _1, lat) => `[${lng},${lat}]`,
      ),
  );

  if (type === 'Point') [coordinates] = coordinates; // fix double bracket

  // simplify multipolygons that only have one member (the outer way)
  if (
    type === 'MultiPolygon' &&
    coordinates.length === 1 &&
    coordinates[0].length === 1
  ) {
    type = 'Polygon';
    [coordinates] = coordinates;
  }

  // TODO: reverse coordinates? coastline, cliff, emabankment, landslide, antarctic_depForm, antarctic_melt_stream were facing the wrong way

  return { type, coordinates };
};
