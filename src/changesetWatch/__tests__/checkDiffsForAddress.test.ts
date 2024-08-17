import type { Changeset, OsmChange } from 'osm-api';
import { checkDiffsForAddress } from '../checkDiffsForAddress.js';

const cs: Changeset = {
  id: 123456,
  created_at: new Date('2021-12-01T00:11:33.000Z'),
  closed_at: new Date('2021-12-01T00:11:34.000Z'),
  open: false,
  comments_count: 0,
  changes_count: 1,
  min_lat: -36.8036373,
  min_lon: 174.7845216,
  max_lat: -36.8030968,
  max_lon: 174.7852931,
  uid: 10140394,
  user: 'kylenz',
  tags: {
    changesets_count: '5580',
    imagery_used: 'LINZ NZ Aerial Imagery',
    locale: 'en-NZ',
    host: 'https://www.openstreetmap.org/edit',
    created_by: 'iD 2.20.2',
    comment: 'update Eastern Busway construction',
  },
};

// in this changeset:
// node1 -> merged into new building way1
// node2 -> merged into existing building way2
// way3 -> outright deleted
// node4 -> deleted, then they recreated it as node5 but without the ref: tag
const diff: OsmChange = {
  create: [
    {
      type: 'way',
      id: 1,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 1,
      tags: {
        'addr:housenumber': '1',
        'addr:street': 'Marine Parade',
        'addr:suburb': 'Devonport',
        'ref:linz:address_id': '2015480',
        building: 'house',
      },
      nodes: [3, 4, 5, 6, 3],
    },
    {
      type: 'node',
      id: 5,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 2,
      tags: {
        'addr:housenumber': '157',
        'addr:street': 'North Cove',
        'addr:suburb': 'Kawau Island',
        // re-created but without a `ref:linz:address_id` tag
      },
      lat: -36,
      lon: 174,
    },
  ],
  modify: [
    {
      type: 'way',
      id: 2,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 2,
      tags: {
        'addr:housenumber': '2',
        'addr:street': 'Marine Parade',
        'addr:suburb': 'Devonport',
        'ref:linz:address_id': '2015481',
        building: 'house',
      },
      nodes: [7, 8, 9, 10, 7],
    },
  ],
  delete: [
    {
      type: 'node',
      id: 1,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 2,
      tags: {
        'addr:housenumber': '1',
        'addr:street': 'Marine Parade',
        'addr:suburb': 'Devonport',
        'ref:linz:address_id': '2015480',
      },
      lat: -36,
      lon: 174,
    },
    {
      type: 'node',
      id: 2,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 2,
      tags: {
        'addr:housenumber': '2',
        'addr:street': 'Marine Parade',
        'addr:suburb': 'Devonport',
        'ref:linz:address_id': '2015481',
      },
      lat: -36,
      lon: 174,
    },
    {
      type: 'way',
      id: 3,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 2,
      tags: {
        'addr:housenumber': '3',
        'addr:street': 'Marine Parade',
        'addr:suburb': 'Devonport',
        'ref:linz:address_id': '2015482',
        building: 'yes',
      },
      nodes: [11, 12, 13, 14, 11],
    },
    {
      type: 'node',
      id: 4,
      timestamp: '2021-12-16T16:57:38Z',
      changeset: 123,
      uid: 10140394,
      user: 'kylenz',
      version: 2,
      tags: {
        'addr:housenumber': '157',
        'addr:street': 'North Cove',
        'addr:suburb': 'Kawau Island',
        'ref:linz:address_id': '2166053',
      },
      lat: -36,
      lon: 174,
    },
  ],
};

describe('checkDiffsForAddress', () => {
  it('can figure out if any addresses were deleted', () => {
    expect(checkDiffsForAddress([{ cs, diff }])).toStrictEqual([
      {
        addrId: '2015482',
        comment: 'cs123456 (iD): update Eastern Busway construction',
        date: new Date('2021-12-01T00:11:34.000Z'),
        isDataError: false,
        streetAddress: '3 Marine Parade',
        suburb: 'Devonport',
        user: 'kylenz',
      },
    ]);
  });
});
