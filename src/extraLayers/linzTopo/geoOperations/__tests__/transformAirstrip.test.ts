import { GeoJson, Tags } from '../../../../types';
import { transformAirstrip } from '../transformAirstrip';
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
