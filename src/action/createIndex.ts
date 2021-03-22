import { promises as fs } from 'fs';
import { join } from 'path';
import { Index } from '../types';
import { CDN_URL, mock, REGEX, suburbsFolder } from './util';

export async function createIndex(index: Index[]): Promise<void> {
  // create index.json
  const indexFile = {
    fields: [
      {
        name: 'addr_housenumber',
        type: 'esriFieldTypeString',
        alias: 'addr:housenumber',
        sqlType: 'sqlTypeOther',
        length: 10,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        name: 'addr_street',
        type: 'esriFieldTypeString',
        alias: 'addr:street',
        sqlType: 'sqlTypeOther',
        length: 50,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        name: 'addr_suburb',
        type: 'esriFieldTypeString',
        alias: 'addr:suburb',
        sqlType: 'sqlTypeOther',
        length: 50,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        name: 'addr_hamlet',
        type: 'esriFieldTypeString',
        alias: 'addr:hamlet',
        sqlType: 'sqlTypeOther',
        length: 2,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        name: 'addr_type',
        type: 'esriFieldTypeString',
        alias: 'addr:type',
        sqlType: 'sqlTypeOther',
        length: 2,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        // symbolic, should NOT be added to the OSM graph
        name: 'new_linz_ref',
        type: 'esriFieldTypeString',
        alias: 'new_linz_ref',
        sqlType: 'sqlTypeOther',
        length: 2,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        // symbolic, should NOT be added to the OSM graph
        name: 'osm_id',
        type: 'esriFieldTypeString',
        alias: 'osm_id',
        sqlType: 'sqlTypeOther',
        length: 2,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
      {
        name: 'ref_linz_address',
        type: 'esriFieldTypeOID',
        alias: 'ref:linz:address_id',
        sqlType: 'sqlTypeOther',
        length: 10,
        nullable: true,
        editable: true,
        domain: null,
        defaultValue: null,
      },
    ],
    results: index
      .map(({ suburb, bbox, count, action }) => ({
        id: suburb.replace(/\//g, '-'),
        licenseInfo:
          'See https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
        url: `${CDN_URL}/suburbs/${suburb.replace(REGEX, '-')}.geo.json`,
        itemURL: CDN_URL,
        ...(!mock && { created: Date.now(), modified: Date.now() }),
        name: `${suburb} (${count})`,
        title: `${suburb} (${count})`,
        type: 'Feature Service',
        description: `${count} address points for ${suburb} (${
          action || 'add & delete'
        })`,
        snippet: `${count} address points for ${suburb} (${
          action || 'add & delete'
        })`,
        tags: [suburb, 'address', 'OSM', 'OpenStreetMap'],
        thumbnail: `https://linz-addr.kyle.kiwi/img/thumbnail.png`,
        extent: [
          [bbox.minLng, bbox.minLat],
          [bbox.maxLng, bbox.maxLat],
        ],
        categories: [],
        properties: null,
        access: 'public',
        size: -1,
        languages: [],
        listed: false,
        groupCategories: [
          action ? '/Categories/Preview' : '/Categories/Addresses',
        ],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  await fs.writeFile(
    join(suburbsFolder, '../index.json'),
    JSON.stringify(indexFile, null, mock ? 2 : undefined),
  );
}
