import { Coord, GeoJson } from '../../../../types';
import { simplify } from '../simplify';
import _testCases from './simplify.geo.json';

const testCases = _testCases as unknown as GeoJson;

describe('simplify', () => {
  it('can simplify ways', () => {
    const input = testCases.features[0].geometry.coordinates as Coord[];
    const output = testCases.features[1].geometry.coordinates as Coord[];

    expect(input).toHaveLength(64);
    expect(output).toHaveLength(25);

    const simplified = simplify(input, 0.00003);
    expect(simplified).toHaveLength(25);
    expect(simplified).toStrictEqual(output);
  });
});
