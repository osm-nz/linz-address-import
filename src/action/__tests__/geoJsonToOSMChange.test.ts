import { GeoJson, GeoJsonFeature } from '../../types';
import { geoJsonToOSMChange } from '../geoJsonToOSMChange';

const geoJson = (features: GeoJsonFeature[]): GeoJson => ({
  type: 'FeatureCollection',
  crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  features,
});

const Point: GeoJsonFeature = {
  type: 'Feature',
  id: '1',
  geometry: {
    type: 'Point',
    coordinates: [174.7, -36.9],
  },
  properties: {
    natural: 'peak',
    name: undefined,
    description: '',
  },
};
const LineString: GeoJsonFeature = {
  type: 'Feature',
  id: '2',
  geometry: {
    type: 'LineString',
    coordinates: [
      [174.5, -37],
      [174.6, -37],
    ],
  },
  properties: { highway: 'footway' },
};

const Polygon: GeoJsonFeature = {
  type: 'Feature',
  id: '3',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [174.8, -36.9],
        [174.81, -36.91],
        [174.82, -36.92],
        [174.8, -36.9],
      ],
    ],
  },
  properties: {
    ref: '1',
    landuse: 'aquaculture',
  },
};
const MultiPolygon: GeoJsonFeature = {
  type: 'Feature',
  id: '4',
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        // outer way 1:
        [
          [1, 2],
          [3, 4],
          [5, 6],
          [7, 8],
        ],
        // inner way 1:
        [
          [15, 16],
          [17, 18],
          [19, 20],
          [21, 22],
        ],
        // inner way 2:
        [
          [23, 24],
          [25, 26],
          [27, 28],
        ],
      ],
      [
        // outer way 2:
        [
          [9, 10],
          [11, 12],
          [13, 14],
        ],
      ],
    ],
  },
  properties: {
    ref: '1',
    landuse: 'aquaculture',
  },
};

describe('geoJsonToOSMChange', () => {
  it('can convert files with Point', () => {
    const file = geoJson([Point]);
    expect(
      geoJsonToOSMChange(file, 'test layer', 'add 1').osmChange,
    ).toMatchSnapshot();
  });

  it('can convert files with LineString', () => {
    const file = geoJson([LineString]);
    expect(
      geoJsonToOSMChange(file, 'test layer', 'add 1').osmChange,
    ).toMatchSnapshot();
  });

  it('can convert files with Polygon', () => {
    const file = geoJson([Polygon]);
    expect(
      geoJsonToOSMChange(file, 'test layer', 'add 1').osmChange,
    ).toMatchSnapshot();
  });

  it('can convert files with MultiPolygon', () => {
    const file = geoJson([MultiPolygon]);
    expect(
      geoJsonToOSMChange(file, 'test layer', 'add 1').osmChange,
    ).toMatchSnapshot();
  });

  it('can convert files with all features', () => {
    const file = geoJson([Point, LineString, Polygon, LineString]);
    expect(
      geoJsonToOSMChange(file, 'test layer', 'add 4').osmChange,
    ).toMatchSnapshot();
  });
});
