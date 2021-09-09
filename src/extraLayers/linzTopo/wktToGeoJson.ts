import { chunk } from '../../common';
import { GeoJsonCoords } from '../../types';
import { simplify } from './simplify';

type Coord = [lng: number, lat: number];

const TYPES = <const>{
  POINT: 'Point',
  LINESTRING: 'LineString',
  POLYGON: 'Polygon',
  MULTIPOLYGON: 'MultiPolygon',
};

/** from https://api.openstreetmap.org/api/0.6/capabilities */
const MAX_WAY_LENGTH = process.env.NODE_ENV === 'test' ? 6 : 2000;
/**
 * if we have to split a way >MAX_WAY_LENGTH, we will create several chunks
 * of this length. See opennewzealand/linz2osm#10 for why we use 495
 */
const CHUNKED_WAY_LENGTH = process.env.NODE_ENV === 'test' ? 4 : 495;

/** tolerance for https://mourner.github.io/simplify-js */
const WAY_SIMPLIFICATION = 0.00003;

/**
 * Converts {@link https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry WKT} to geojson
 */
export const wktToGeoJson = (
  wkt: string,
  layerName?: string,
  shouldSimplify?: boolean,
): GeoJsonCoords => {
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

  // coastline, cliff, emabankment, landslide, antarctic_depForm,
  // antarctic_melt_stream were all facing the wrong way, so we reverse the way
  if (type === 'LineString') {
    coordinates.reverse();
    if (shouldSimplify) coordinates = simplify(coordinates, WAY_SIMPLIFICATION);
  }

  // RapiD doesn't support multipolygons of unclosed ways yet.
  if (type === 'LineString' && coordinates.length > MAX_WAY_LENGTH) {
    console.warn(`${layerName} has a way with >${MAX_WAY_LENGTH} nodes`);
  }

  // convert huge Polygons into MultiPolygons with multiple outer ways
  if (
    type === 'Polygon' &&
    coordinates.some((c: number[]) => c.length > MAX_WAY_LENGTH)
  ) {
    type = 'MultiPolygon';
    const [outer, ...inner] = coordinates;

    const newOuterWays: Coord[][] = chunk<Coord>(outer, CHUNKED_WAY_LENGTH);
    const newInnerWays: Coord[][] = [];
    for (let i = 0; i < inner.length; i += 1) {
      newInnerWays.push(...chunk<Coord>(inner[i], CHUNKED_WAY_LENGTH));
    }
    coordinates = newOuterWays.map((C) => [C]);
    coordinates[0].push(...newInnerWays);
  } else if (
    type === 'MultiPolygon' &&
    coordinates.some((c: number[][]) =>
      c.some((cc) => cc.length > MAX_WAY_LENGTH),
    )
  ) {
    // this is non trivial to fix
    console.warn(
      `${layerName} has a MultiPolygon with >${MAX_WAY_LENGTH} nodes`,
    );
  }

  return { type, coordinates };
};
