import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { GeoJson, HandlerReturnWithBBox } from '../types.js';
import { hash } from '../common/index.js';
import { CDN_URL, calcCount, mock, suburbsFolder } from './util/index.js';

function toId(suburb: string) {
  // macrons are url safe
  return `${suburb.replaceAll(/[^\dA-Za-zĀāĒēĪīŌōŪū]/g, '')}_${hash(suburb)}`;
}

export async function createIndex(
  suburbs: HandlerReturnWithBBox,
): Promise<void> {
  const meta = Object.entries(suburbs).map(([suburb, v]) => ({
    suburb,
    bbox: v.bbox,
    instructions: v.instructions,
    ...calcCount(v.features),
  }));

  // create index.json
  const indexFile = {
    fields: [],
    results: meta
      .map((v) => {
        const title = v.suburb.replace('ZZ ', '').replace('Z ', '');
        return {
          id: toId(v.suburb),
          url: `${CDN_URL}/suburbs/${toId(v.suburb)}.osmPatch.geo.json`,
          name: title,
          title,
          totalCount: v.totalCount,
          source: '',
          snippet: v.count,
          extent: [
            [v.bbox.minLng, v.bbox.minLat],
            [v.bbox.maxLng, v.bbox.maxLat],
          ],
          instructions: v.instructions,
          groupCategories: [
            v.suburb.startsWith('ZZ')
              ? '/Categories/Preview'
              : '/Categories/Addresses',
          ],
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  await fs.writeFile(
    join(suburbsFolder, '../index.json'),
    JSON.stringify(indexFile, null, mock ? 2 : undefined),
  );

  // save each suburb
  for (const s of meta) {
    const { suburb } = s;
    const geojson: GeoJson = {
      type: 'FeatureCollection',
      ...suburbs[suburb],
    };
    geojson.changesetTags ||= {
      attribution: 'https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
      created_by: 'LINZ Data Import 2.0.0',
      locale: 'en-NZ',
      source: 'https://wiki.osm.org/LINZ',
      comment: suburb,
    };

    await fs.writeFile(
      join(suburbsFolder, `${toId(suburb)}.osmPatch.geo.json`),
      JSON.stringify(geojson, null, mock ? 2 : undefined),
    );
  }
}
