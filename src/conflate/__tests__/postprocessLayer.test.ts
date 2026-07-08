import type {
  DatasetId,
  OsmFeature,
  OsmId,
  SourceDataFeature,
} from '@osm-conflation-engine/cli';
import type { OsmPatchFeature } from 'osm-api';
import type { Point } from 'geojson';
import { postprocessLayer } from '../postprocessLayer.js';
import type { LinzAddr } from '../../types.js';

describe(postprocessLayer, () => {
  it('can swap features', () => {
    const diffs: OsmPatchFeature[] = [
      {
        type: 'Feature',
        id: 'n1',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { 'addr:housenumber': '12A' },
      },
      {
        type: 'Feature',
        id: 'n2',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { 'addr:housenumber': '12B' },
      },
    ];
    const osmData: Record<OsmId, OsmFeature> = {
      n1: <OsmFeature>(<Partial<OsmFeature>>{
        id: 'n1',
        tags: {
          'addr:housenumber': '12B',
          'addr:street': 'Example St',
          'ref:linz:address_id': 'row1',
        },
      }),
      n2: <OsmFeature>(<Partial<OsmFeature>>{
        id: 'n2',
        tags: {
          'addr:housenumber': '12A',
          'addr:street': 'Example St',
          'ref:linz:address_id': 'row2',
        },
      }),
    };
    const sourceData: Record<DatasetId, SourceDataFeature<Point, LinzAddr>> = {
      [<DatasetId>'row1']: <never>{
        properties: { id: 'row1', housenumber: '12A', street: 'Example St' },
      },
      [<DatasetId>'row2']: <never>{
        properties: { id: 'row2', housenumber: '12B', street: 'Example St' },
      },
    };
    expect(
      postprocessLayer({ group: '', features: diffs, osmData, sourceData }),
    ).toStrictEqual([
      {
        type: 'Feature',
        id: 'n1',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { __action: 'edit', 'ref:linz:address_id': 'row2' },
      },
      {
        type: 'Feature',
        id: 'n2',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { __action: 'edit', 'ref:linz:address_id': 'row1' },
      },
    ]);
  });
});
