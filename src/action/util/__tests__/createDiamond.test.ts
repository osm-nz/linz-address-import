import { createDiamond } from '../createDiamond';

describe('createDiamond', () => {
  it('generates the correct bbox diamond for a point', () => {
    expect(createDiamond({ lat: -36, lng: 174 })).toStrictEqual([
      [
        [174, -35.9998],
        [174.0002, -36],
        [174, -36.0002],
        [173.9998, -36],
        [174, -35.9998],
      ],
    ]);
  });
});
