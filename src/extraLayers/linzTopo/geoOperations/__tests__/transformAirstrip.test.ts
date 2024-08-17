import type { GeoJson, Tags } from '../../../../types.js';
import { transformAirstrip } from '../transformAirstrip.js';
import _testCases from './transformAirstrip.geo.json';

const testCases = _testCases as unknown as GeoJson;

describe('transformAirstrip', () => {
  it('can simplify reactangular airstrip areas to lines', () => {
    expect(
      transformAirstrip(
        testCases.features[0].geometry,
        testCases.features[0].properties.tags as unknown as Tags,
      ),
    ).toStrictEqual([
      testCases.features[1].geometry,
      testCases.features[1].properties.tags as unknown as Tags,
    ]);
  });

  it('can simplify non airstrip areas to lines after orthogonalizing it', () => {
    expect(
      transformAirstrip(
        testCases.features[2].geometry,
        testCases.features[2].properties.tags as unknown as Tags,
      ),
    ).toStrictEqual([
      testCases.features[3].geometry,
      testCases.features[3].properties.tags as unknown as Tags,
    ]);
  });
});
