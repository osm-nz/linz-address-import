import { GeoJsonFeature } from '../../../types';
import { splitUntilSmallEnough, normalizeName } from '../splitUntilSmallEnough';

jest.mock('../const', () => ({
  ...jest.requireActual('../const'),
  MAX_ITEMS_PER_DATASET: 2,
}));

const point = (lat: number, lng: number): GeoJsonFeature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [lng, lat] },
  id: '',
  properties: {},
});

const changesetTags = { comment: 'hi' };

const taka = point(-36.78766, 174.77309);
const kumeū = point(-36.77705, 174.55489);
const drury = point(-37.10182, 174.95275);

describe('splitUntilSmallEnough', () => {
  it('correctly splits N-S', () => {
    expect(
      splitUntilSmallEnough('Import geysers', 'a', changesetTags, [
        taka,
        taka,
        drury,
      ]),
    ).toStrictEqual({
      'Import geysers^N': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [taka, taka],
        changesetTags,
      },
      'Import geysers^S': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [drury],
        changesetTags,
      },
    });
  });

  it('correctly splits E-W', () => {
    expect(
      splitUntilSmallEnough('Import geysers', 'a', changesetTags, [
        taka,
        kumeū,
        kumeū,
      ]),
    ).toStrictEqual({
      'Import geysers^E': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [taka],
        changesetTags,
      },
      'Import geysers^W': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [kumeū, kumeū],
        changesetTags,
      },
    });
  });

  it('can recursively split', () => {
    expect(
      splitUntilSmallEnough('Import geysers', 'a', changesetTags, [
        taka,
        taka,
        kumeū,
        drury,
        drury,
      ]),
    ).toStrictEqual({
      // first it split E-W, then it further divided the east chunk into N-S
      'Import geysers^E^N': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [taka, taka],
        changesetTags,
      },
      'Import geysers^E^S': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [drury, drury],
        changesetTags,
      },
      'Import geysers^W': {
        bbox: expect.any(Object),
        instructions: 'a',
        features: [kumeū],
        changesetTags,
      },
    });
  });
});

describe('normalizeName', () => {
  it.each`
    inKeys                                                   | outKeys
    ${['a^N^S']}                                             | ${['a 1']}
    ${['a^N', 'a^S']}                                        | ${['a 1', 'a 2']}
    ${['a^N', 'a^S', 'a^E', 'a^S^E^W', 'a', 'b', 'b^S^S^X']} | ${['a 1', 'a 2', 'a 3', 'a 4', 'a', 'b', 'b 1']}
  `('can normalize weird names $#', ({ inKeys, outKeys }) => {
    const input = Object.fromEntries(inKeys.map((k: string) => [k, 1]));
    const output = Object.fromEntries(outKeys.map((k: string) => [k, 1]));

    expect(normalizeName(input as never)).toStrictEqual(output);
  });
});
