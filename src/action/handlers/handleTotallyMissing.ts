/* eslint-disable no-param-reassign */
import { promises as fs } from 'fs';
import { join } from 'path';
import { LinzAddr, Status, StatusReport } from '../../types';
import { outFolder, CDN_URL } from '../util';

const suburbsFolder = join(outFolder, './suburbs');

const REGEX = /(\/| )+/g;

const SPECIAL = [
  {
    suburb: 'ZZ Special Location Wrong',
    // temporary, lazy assumption to cover the whole mainland + chathams + stewart is.
    bbox: {
      minLat: -48.026701,
      maxLat: -32.932388,
      minLng: 165.019045,
      maxLng: 184.227542,
    },
    count: -1,
  },
];

export async function handleTotallyMissing(
  arr: StatusReport[Status.TOTALLY_MISSING],
): Promise<void> {
  await fs.mkdir(suburbsFolder, { recursive: true });

  const bySuburb = arr.reduce((ac, [linzId, data]) => {
    const key = data.suburb[1];
    ac[key] ||= [];
    ac[key].push([linzId, data]);
    return ac;
  }, {} as Record<string, [linzId: string, data: LinzAddr][]>);

  const index = [];

  for (const suburb in bySuburb) {
    const bbox = {
      minLat: Infinity,
      minLng: Infinity,
      maxLat: -Infinity,
      maxLng: -Infinity,
    };
    const geojson = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features: bySuburb[suburb].map(([linzId, addr]) => {
        // bbox
        if (addr.lat < bbox.minLat) bbox.minLat = addr.lat;
        if (addr.lng < bbox.minLng) bbox.minLng = addr.lng;
        if (addr.lat > bbox.maxLat) bbox.maxLat = addr.lat;
        if (addr.lng > bbox.maxLng) bbox.maxLng = addr.lng;

        return {
          type: 'Feature',
          id: linzId,
          geometry: {
            type: 'Point',
            coordinates: [addr.lng, addr.lat],
          },
          properties: {
            addr_housenumber: addr.housenumber,
            addr_street: addr.street,
            addr_suburb: addr.suburb[0] === 'U' ? addr.suburb[1] : undefined,
            addr_hamlet: addr.suburb[0] === 'R' ? addr.suburb[1] : undefined,
            ref_linz_address: linzId,
          },
        };
      }),
    };
    await fs.writeFile(
      join(suburbsFolder, `${suburb.replace(REGEX, '-')}.geo.json`),
      JSON.stringify(geojson),
    );

    index.push({ suburb, count: bySuburb[suburb].length, bbox });
  }

  const date = new Date().toISOString().split('T')[0];

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
    results: [...SPECIAL, ...index]
      .map(({ suburb, bbox, count }) => ({
        id: suburb,
        licenseInfo:
          'See https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
        url: `${CDN_URL}/suburbs/${suburb.replace(REGEX, '-')}.geo.json`,
        itemURL: CDN_URL,
        created: Date.now(),
        modified: Date.now(),
        name: `${suburb} Addresses (${count})`,
        title: `${suburb} Addresses (${count})`,
        type: 'Feature Service',
        description: `${count} missing address points for ${suburb} sourced from LINZ, last updated on ${date}`,
        snippet: `${count} missing address points for ${suburb} sourced from LINZ, last updated on ${date}`,
        tags: [suburb, 'address', 'OSM', 'OpenStreetMap'],
        thumbnail: `${CDN_URL}/thumbnail.png`,
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
        groupCategories: ['/Categories/Addresses'],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  await fs.writeFile(
    join(suburbsFolder, '../index.json'),
    JSON.stringify(indexFile),
  );
}
/* eslint-enable no-param-reassign */
