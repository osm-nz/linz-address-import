import type { OsmFeature } from '@osm-conflation-engine/cli';
import { checkStackedAddr } from '../checkStackedAddr.js';
import type { LinzSourceFeature } from '../../types.js';

vi.mock('node:fs', async () => ({
  ...vi.importActual('node:fs'),
  readFileSync: () => '{}',
}));

const [r1, r2, r3, r4, r5] = [
  <LinzSourceFeature>{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { id: 'row1', housenumber: '1A', street: 'Example St' },
  },
  <LinzSourceFeature>{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { id: 'row2', housenumber: '1B', street: 'Example St' },
  },
  <LinzSourceFeature>{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { id: 'row3', housenumber: '1C', street: 'Example St' },
  },
  <LinzSourceFeature>{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { id: 'row4', housenumber: '1D', street: 'Example St' },
  },
  <LinzSourceFeature>{
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { id: 'row5', housenumber: '2', street: 'Side St' },
  },
];

describe(checkStackedAddr, () => {
  it('rejects cases where the number of IDs doesn’t match (too few)', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: { 'ref:linz:address_id': 'row1;row2' },
    });
    expect(checkStackedAddr(osmAddr, [r1, r2, r3])).toBeUndefined();
  });

  it('rejects cases where the number of IDs doesn’t match (too many)', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: { 'ref:linz:address_id': 'row1;row2;row3' },
    });
    expect(checkStackedAddr(osmAddr, [r1, r2])).toBeUndefined();
  });

  it('rejects cases where the housenumber contains a semicolon', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: { 'addr:housenumber': '1A;1B', 'ref:linz:address_id': 'row1;row2' },
    });
    expect(checkStackedAddr(osmAddr, [r1, r2])).toBeUndefined();
  });

  it('rejects cases where the street contains a semicolon', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: {
        'addr:street': 'Example St;Other Road',
        'ref:linz:address_id': 'row1;row2',
      },
    });
    expect(checkStackedAddr(osmAddr, [r1, r2])).toBeUndefined();
  });

  it('conflates tags for the main feature', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: {
        'addr:housenumber': '1A',
        'alt_addr:housenumber': '1B',
        'addr:street': 'Wrong Road',
        'ref:linz:address_id': 'row1;row2',
      },
      centroid: [0, 0],
    });
    expect(checkStackedAddr(osmAddr, [r1, r2])).toStrictEqual({
      group: 'Address Update - undefined, undefined',
      diff: {
        geometry: undefined,
        tags: { __action: 'edit', 'addr:street': 'Example St' },
      },
    });
  });

  it('conflates tags for the alt feature', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: {
        'addr:housenumber': '1A',
        'alt_addr:housenumber': 'wrongggg value',
        'addr:street': 'Example St',
        'ref:linz:address_id': 'row1;row2',
      },
      centroid: [0, 0],
    });
    expect(checkStackedAddr(osmAddr, [r1, r2])).toStrictEqual({
      group: 'Address Update - undefined, undefined',
      diff: {
        geometry: undefined,
        tags: { __action: 'edit', 'alt_addr:housenumber': '1B' },
      },
    });
  });

  it('supports fixing weird combinations of alt_addr:* and addrN:*', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: {
        'addr:housenumber': '1A',
        'alt_addr:housenumber': '1B',
        'addr2:housenumber': '1C',
        'addr3:housenumber': 'typooo',
        'addr:street': 'Example St',
        'ref:linz:address_id': 'row1;row2;row3;row4',
      },
      centroid: [0, 0],
    });
    expect(checkStackedAddr(osmAddr, [r1, r2, r3, r4])).toStrictEqual({
      group: 'Address Update - undefined, undefined',
      diff: {
        geometry: undefined,
        tags: { __action: 'edit', 'addr3:housenumber': '1D' },
      },
    });
  });

  it('suggests adding alt_addr:street if the streets differ', () => {
    const osmAddr = <OsmFeature>(<never>{
      tags: {
        'addr:housenumber': '1A',
        'alt_addr:housenumber': '2',
        'addr:street': 'Example St',
        'ref:linz:address_id': 'row1;row5',
      },
      centroid: [0, 0],
    });
    expect(checkStackedAddr(osmAddr, [r1, r5])).toStrictEqual({
      group: 'Address Update - undefined, undefined',
      diff: {
        geometry: undefined,
        tags: { __action: 'edit', 'alt_addr:street': 'Side St' },
      },
    });
  });
});
