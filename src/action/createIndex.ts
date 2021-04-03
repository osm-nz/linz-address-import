import { promises as fs } from 'fs';
import { join } from 'path';
import { GeoJson, HandlerReturnWithBBox } from '../types';
import { calcCount, CDN_URL, mock, REGEX, suburbsFolder } from './util';

export async function createIndex(
  suburbs: HandlerReturnWithBBox,
): Promise<void> {
  const meta = Object.entries(suburbs).map(([suburb, v]) => ({
    suburb,
    bbox: v.bbox,
    ...calcCount(v.features),
  }));

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
    results: meta
      .map(({ suburb, bbox, count, totalCount }) => ({
        id: suburb.replace(/\//g, '-'),
        licenseInfo:
          'See https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
        url: `${CDN_URL}/suburbs/${suburb.replace(REGEX, '-')}.geo.json`,
        itemURL: CDN_URL,
        ...(!mock && { created: Date.now(), modified: Date.now() }),
        name: suburb,
        title: suburb,
        type: 'Feature Service',
        totalCount,
        description: count,
        snippet: count,
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
          suburb.startsWith('ZZ')
            ? '/Categories/Preview'
            : '/Categories/Addresses',
        ],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  await fs.writeFile(
    join(suburbsFolder, '../index.json'),
    JSON.stringify(indexFile, null, mock ? 2 : undefined),
  );

  // save each suburb
  for (const suburb in suburbs) {
    const geojson: GeoJson = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features: suburbs[suburb].features,
    };
    await fs.writeFile(
      join(suburbsFolder, `${suburb.replace(REGEX, '-')}.geo.json`),
      JSON.stringify(geojson, null, mock ? 2 : undefined),
    );
  }
}
