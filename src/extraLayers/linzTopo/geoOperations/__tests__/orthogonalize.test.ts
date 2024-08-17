import type { Coord, GeoJson } from '../../../../types.js';
import { orthogonalize } from '../orthogonalize.js';
import _testCases from './orthogonalize.geo.json';

const testCases = _testCases as unknown as GeoJson;

//
// copied from https://github.com/openstreetmap/iD/blob/develop/test/spec/actions/orthogonalize.js
//

describe('orthogonalize', () => {
  it('deletes empty redundant nodes', () => {
    //    e - d - c
    //    |       |
    //    a ----- b
    expect(
      orthogonalize([
        [0, 0], // a
        [2, 0], // b
        [2, 2], // c
        [1, 2], // d
        [0, 2], // e
        [0, 0], // a
      ]),
    ).toStrictEqual([
      [0, 0], // a
      [2, 0], // b
      [2, 2], // c
      [0, 2], // e
      [0, 0], // a
    ]);
  });

  it('only moves nodes which are near right or near straight', () => {
    //    f - e
    //    |    \
    //    |     d - c
    //    |         |
    //    a -------- b
    expect(
      orthogonalize([
        [0, 0], // a
        [3.1, 0], // b
        [3, 1], // c
        [2, 1], // d
        [1, 2], // e
        [0, 2], // f
        [0, 0], // a
      ]),
    ).toStrictEqual([
      [0.036189622922034384, 0.03681682980856563], // a'
      [3.0223129644532105, 0.07356740452081668], // b'
      [3.010663279786202, 1.0126036889854662], // c'
      [2, 1], // d
      [1, 2], // e
      [0.012253637973457186, 1.9879174196920026], // f'
      [0.036189622922034384, 0.03681682980856563], // a'
    ]);
  });

  it('works for a rectangularish runway', () => {
    expect(
      orthogonalize([
        [172.87368694889, -42.8944884440366], // a
        [172.871480948763, -42.8938125328441], // b
        [172.868151474952, -42.8892012428519], // c
        [172.869463654716, -42.8887275453541], // d
        [172.872077103728, -42.8922000568008], // e
        [172.87368694889, -42.8944884440366], // a
      ]),
    ).toStrictEqual([
      [172.87368694889, -42.8944884440366], // a
      [172.871480948763, -42.8938125328441], // b
      [172.868151474952, -42.8892012428519], // c
      [172.869463654716, -42.8887275453541], // d
      [172.87368694889, -42.8944884440366], // a
    ]);
  });

  it('works for a really weird runway', () => {
    const input = testCases.features[0].geometry.coordinates[0] as Coord[];
    const outputFirstPass = testCases.features[1].geometry
      .coordinates[0] as Coord[];
    const outputSecondPass = testCases.features[2].geometry
      .coordinates[0] as Coord[];

    expect(orthogonalize(input)).toStrictEqual(outputFirstPass);
    expect(orthogonalize(outputFirstPass)).toStrictEqual(outputSecondPass);
  });
});
