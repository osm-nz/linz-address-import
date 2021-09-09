import { promises as fs } from 'fs';
import { join } from 'path';
import { GeoJson, HandlerReturnWithBBox } from '../types';
import { calcCount, CDN_URL, mock, suburbsFolder } from './util';
import { hash } from '../common';
import { geoJsonToOSMChange } from './geoJsonToOSMChange';

function toId(suburb: string) {
  // macrons are url safe
  return `${suburb.replace(/[^a-zA-ZāēīōūĀĒĪŌŪ]/g, '')}_${hash(suburb)}`;
}

export async function createIndex(
  suburbs: HandlerReturnWithBBox,
): Promise<void> {
  const meta = Object.entries(suburbs).map(([suburb, v]) => ({
    suburb,
    bbox: v.bbox,
    osmChangeAvailable:
      // osmChange fails are not available for addresses, nor if there are edits/moves/deletes
      !suburb.includes('Address Update') &&
      !v.features.some((f) => f.id.startsWith('SPECIAL_')),
    ...calcCount(v.features),
  }));

  // create index.json
  const indexFile = {
    // heritage - we could technically remove this. Requires updating geojson files too
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
      .map(({ suburb, bbox, count, totalCount, osmChangeAvailable }) => ({
        id: toId(suburb),
        url: `${CDN_URL}/suburbs/${toId(suburb)}.geo.json`,
        name: suburb,
        title: suburb,
        totalCount,
        source: '',
        snippet: count,
        extent: [
          [bbox.minLng, bbox.minLat],
          [bbox.maxLng, bbox.maxLat],
        ],
        osmChangeAvailable,
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
  for (const s of meta) {
    const { suburb, osmChangeAvailable, count } = s;
    const geojson: GeoJson = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features: suburbs[suburb].features,
    };
    await fs.writeFile(
      join(suburbsFolder, `${toId(suburb)}.geo.json`),
      JSON.stringify(geojson, null, mock ? 2 : undefined),
    );

    if (osmChangeAvailable) {
      const osmChange = geoJsonToOSMChange(geojson, suburb, count);
      await fs.writeFile(join(suburbsFolder, `${toId(suburb)}.osc`), osmChange);
    }
  }
}
