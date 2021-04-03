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
        length: 10,
        editable: true,
      },
      {
        name: 'addr_street',
        type: 'esriFieldTypeString',
        alias: 'addr:street',
        length: 50,
        editable: true,
      },
      {
        name: 'addr_suburb',
        type: 'esriFieldTypeString',
        alias: 'addr:suburb',
        length: 50,
        editable: true,
      },
      {
        name: 'addr_hamlet',
        type: 'esriFieldTypeString',
        alias: 'addr:hamlet',
        length: 2,
        editable: true,
      },
      {
        name: 'addr_type',
        type: 'esriFieldTypeString',
        alias: 'addr:type',
        length: 2,
        editable: true,
      },
      {
        // symbolic, should NOT be added to the OSM graph
        name: 'new_linz_ref',
        type: 'esriFieldTypeString',
        alias: 'new_linz_ref',
        length: 2,
        editable: true,
      },
      {
        // symbolic, should NOT be added to the OSM graph
        name: 'osm_id',
        type: 'esriFieldTypeString',
        alias: 'osm_id',
        length: 2,
        editable: true,
      },
      {
        name: 'ref_linz_address',
        type: 'esriFieldTypeOID',
        alias: 'ref:linz:address_id',
        length: 10,
        editable: true,
      },
    ],
    results: meta
      .map(({ suburb, bbox, count, totalCount }) => ({
        id: suburb.replace(/\//g, '-'),
        url: `${CDN_URL}/suburbs/${suburb.replace(REGEX, '-')}.geo.json`,
        name: suburb,
        title: suburb,
        totalCount,
        snippet: count,
        extent: [
          [bbox.minLng, bbox.minLat],
          [bbox.maxLng, bbox.maxLat],
        ],
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
