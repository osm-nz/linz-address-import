import type { HandlerReturnWithBBox } from '../../../types.js';
import { shiftOverlappingPoints, toFormation } from '../spreadToGrid.js';

describe('toFormation', () => {
  it('has a working formula', () => {
    expect(
      Array.from({ length: 30 })
        .fill(null)
        .map((_, index) => toFormation(index)),
    ).toStrictEqual([
      [0, 0],
      [1, 0],
      [0.71, 0.71],
      [0, 1],
      [2, 0],
      [1.85, 0.77],
      [1.41, 1.41],
      [0.77, 1.85],
      [0, 2],
      [3, 0],
      [2.9, 0.78],
      [2.6, 1.5],
      [2.12, 2.12],
      [1.5, 2.6],
      [0.78, 2.9],
      [0, 3],
      [4, 0],
      [3.92, 0.78],
      [3.7, 1.53],
      [3.33, 2.22],
      [2.83, 2.83],
      [2.22, 3.33],
      [1.53, 3.7],
      [0.78, 3.92],
      [0, 4],
      [5, 0],
      [4.94, 0.78],
      [4.76, 1.55],
      [4.46, 2.27],
      [4.05, 2.94],
    ]);
  });
});

describe('shiftOverlappingPoints', () => {
  const features = [
    {
      properties: { name: 'A' },
      geometry: { type: 'Point', coordinates: [174.123, -36.123] },
    },
    {
      properties: { name: 'B' },
      geometry: { type: 'Point', coordinates: [174.123, -36.123] },
    },
    {
      properties: { name: 'C' },
      geometry: { type: 'Point', coordinates: [174.123, -36.123] },
    },
    {
      properties: { name: 'D' },
      geometry: {
        type: 'MultiLineString',
        coordinates: [[174.456, -36.456]],
      },
    },
  ];

  it('can shift nodes in the same place', () => {
    expect(
      shiftOverlappingPoints({
        'Address Update - Westerberg': { features },
      } as never as HandlerReturnWithBBox),
    ).toStrictEqual({
      'Address Update - Westerberg': {
        features: [
          {
            properties: { name: 'A' },
            geometry: { type: 'Point', coordinates: [174.123, -36.123] },
          },
          {
            properties: { name: 'B' },
            geometry: {
              type: 'Point',
              coordinates: [174.12300399999998, -36.123],
            },
          },
          {
            properties: { name: 'C' },
            geometry: {
              type: 'Point',
              coordinates: [174.12300284, -36.12299716],
            },
          },
          {
            properties: { name: 'D' },
            geometry: {
              type: 'MultiLineString',
              coordinates: [[174.456, -36.456]],
            },
          },
        ],
      },
    });
  });

  it('does not shift special datasets', () => {
    expect(
      shiftOverlappingPoints({
        'Import topmarks - Akl City': { features },
      } as never as HandlerReturnWithBBox),
    ).toStrictEqual({
      'Import topmarks - Akl City': { features },
    });
  });
});
