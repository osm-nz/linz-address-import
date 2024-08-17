import { Changeset, getFeatures, OsmFeature } from 'osm-api';
import { CSWithDiff, patchOsmChange } from '../patchOsmChange';

vi.mock('osm-api');

describe('patchOsmChange', () => {
  it('calls the OSM API and updates the osmChange', async () => {
    m(getFeatures).mockImplementation(async (type: string) => [
      { type, id: 1, tag: { building: 'house' } },
      { type, id: 2, tag: { natural: 'heather' } },
    ]);

    const list: CSWithDiff[] = [
      {
        cs: {} as Changeset,
        diff: {
          create: [],
          modify: <OsmFeature[]>[{ id: 3, type: 'node' }],
          delete: <OsmFeature[]>[
            { id: 1, type: 'node', version: 2 },
            { id: 2, type: 'node', version: 3 },
            { id: 2, type: 'relation', version: 4 },
          ],
        },
      },
    ];

    expect(await patchOsmChange(list)).toStrictEqual([
      {
        cs: {},
        diff: {
          create: [],
          modify: [{ id: 3, type: 'node' }],
          delete: [
            { id: 1, type: 'node', tag: { building: 'house' } },
            { id: 2, type: 'node', tag: { natural: 'heather' } },
            { id: 2, type: 'relation', tag: { natural: 'heather' } },
          ],
        },
      },
    ]);

    // only twice since there were no ways deleted
    expect(getFeatures).toHaveBeenCalledTimes(2);
    expect(getFeatures).toHaveBeenNthCalledWith(1, 'node', ['1v1', '2v2']);
    expect(getFeatures).toHaveBeenNthCalledWith(2, 'relation', ['2v3']);
  });
});
