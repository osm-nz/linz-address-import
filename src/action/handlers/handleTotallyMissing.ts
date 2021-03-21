/* eslint-disable no-param-reassign */
import { promises as fs } from 'fs';
import { join } from 'path';
import { GeoJson, LinzAddr, Status, StatusReport } from '../../types';
import { suburbsFolder, CDN_URL, mock } from '../util';

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
    count: 'N/A',
  },
  {
    suburb: 'ZZ Special Linz Ref Changed',
    // temporary, lazy assumption to cover the whole mainland + chathams + stewart is.
    bbox: {
      minLat: -48.026701,
      maxLat: -32.932388,
      minLng: 165.019045,
      maxLng: 184.227542,
    },
    count: 'N/A',
  },
];

class ExtentRecorder {
  public bbox = {
    minLat: Infinity,
    minLng: Infinity,
    maxLat: -Infinity,
    maxLng: -Infinity,
  };

  visit(addr: LinzAddr) {
    if (addr.lat < this.bbox.minLat) this.bbox.minLat = addr.lat;
    if (addr.lng < this.bbox.minLng) this.bbox.minLng = addr.lng;
    if (addr.lat > this.bbox.maxLat) this.bbox.maxLat = addr.lat;
    if (addr.lng > this.bbox.maxLng) this.bbox.maxLng = addr.lng;
  }
}

type BySuburb = {
  [suburb: string]: [
    linzId: string,
    data: LinzAddr & {
      /** symbolic. if present, tells u that it's to be deleted */
      osmId?: symbol;
    },
  ][];
};

export async function handleTotallyMissing(
  arr: StatusReport[Status.TOTALLY_MISSING],
  needsDeleteArr: StatusReport[Status.NEEDS_DELETE],
): Promise<void> {
  await fs.mkdir(suburbsFolder, { recursive: true });

  const tmp = arr.reduce((ac, [, data]) => {
    const suburb = data.suburb[1];
    if (!ac[suburb]) {
      ac[suburb] = [data.town];
    } else if (!ac[suburb].includes(data.town)) {
      ac[suburb].push(data.town);
    }
    return ac;
  }, {} as Record<string, string[]>);
  const duplicates = Object.keys(tmp).filter((k) => tmp[k].length > 1);

  const bySuburb = arr.reduce<BySuburb>((ac, [linzId, data]) => {
    const suburb = data.suburb[1];
    const key = duplicates.includes(suburb)
      ? `${suburb} (${data.town || 'Rural'})`
      : suburb;

    ac[key] ||= [];
    ac[key].push([linzId, data]);
    return ac;
  }, {});

  for (const [linzId, [suburb, osmAddr]] of needsDeleteArr) {
    // ideally we would deduce which town this deletion belongs to,
    // but there is no trivial way of doing that, so we create a third suburb (Deletions)
    const key = duplicates.includes(suburb) ? `${suburb} (Deletions)` : suburb;

    bySuburb[key] ||= [];

    // because we are deleting the node, if the data is incorrect in osm we don't care so
    // use the OSM data. We identify it as a node to delete if it has the osmId `prop`.
    const fakeLinzAddr = Object.assign(osmAddr, { town: '' }) as LinzAddr;
    fakeLinzAddr.suburb ||= ['' as 'U', suburb]; // sneaky

    bySuburb[key].push([linzId, fakeLinzAddr]);
  }

  const index = [];

  for (const suburb in bySuburb) {
    let minus = 0;
    const extent = new ExtentRecorder();
    const geojson: GeoJson = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features: bySuburb[suburb].map(([linzId, addr]) => {
        extent.visit(addr);
        if (addr.osmId) minus += 1;
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
            addr_type: addr.water ? 'water' : undefined,
            ref_linz_address: (addr.osmId ? 'SPECIAL_DELETE_' : '') + linzId,
          },
        };
      }),
    };
    await fs.writeFile(
      join(suburbsFolder, `${suburb.replace(REGEX, '-')}.geo.json`),
      JSON.stringify(geojson, null, mock ? 2 : undefined),
    );

    const total = bySuburb[suburb].length;
    const plus = total - minus;

    index.push({
      suburb,
      count: `+${plus} -${minus}`,
      bbox: extent.bbox,
    });
  }

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
        id: suburb.replace(/\//g, '-'),
        licenseInfo:
          'See https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
        url: `${CDN_URL}/suburbs/${suburb.replace(REGEX, '-')}.geo.json`,
        itemURL: CDN_URL,
        ...(!mock && { created: Date.now(), modified: Date.now() }),
        name: `${suburb} (${count})`,
        title: `${suburb} (${count})`,
        type: 'Feature Service',
        description: `${count} address points for ${suburb} (add & delete)`,
        snippet: `${count} address points for ${suburb} (add & delete)`,
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
        groupCategories: ['/Categories/Addresses'],
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  await fs.writeFile(
    join(suburbsFolder, '../index.json'),
    JSON.stringify(indexFile, null, mock ? 2 : undefined),
  );
}
/* eslint-enable no-param-reassign */
