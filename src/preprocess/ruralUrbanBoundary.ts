import { createReadStream } from 'node:fs';
import csv from 'csv-parser';
import type { GeoJson } from 'which-polygon';
import { wktToGeoJson } from '../extraLayers/linzTopo/geoOperations/index.js';
import type { GeoJsonFeature } from '../types.js';
import { ruralUrbanCsvFile } from './const.js';

type BoundaryCsv = {
  '\uFEFFWKT': string;
  UR2023_V1_00_NAME: string;
  IUR2023_V1_00_NAME:
    | 'Inland water'
    | 'Inlet'
    | 'Inland water'
    | 'Oceanic'
    // rural
    | 'Rural other'
    | 'Rural settlement'
    // urban
    | 'Small urban area'
    | 'Medium urban area'
    | 'Large urban area'
    | 'Major urban area';
};

export type Boundary = {
  type: 'R' | 'U';
  name: string;
};

export async function readRuralUrbanBoundaryFile(): Promise<GeoJson<Boundary>> {
  return new Promise((resolve, reject) => {
    const features: GeoJsonFeature<Boundary>[] = [];

    createReadStream(ruralUrbanCsvFile)
      .pipe(csv())
      .on('data', (data: BoundaryCsv) => {
        const {
          '\uFEFFWKT': wkt,
          UR2023_V1_00_NAME: name,
          IUR2023_V1_00_NAME: category,
        } = data;

        if (!wkt) return; // no geometry for this area

        const geometry = wktToGeoJson(
          wkt,
          'rural/urban boundary',
          true,
          undefined,
          true,
        );

        // only add urban areas, everything else is assumed to be rural
        if (category.includes('urban') || category === 'Rural settlement') {
          features.push({
            type: 'Feature',
            geometry,
            id: name,
            properties: {
              type: 'U',
              name,
            },
          });
        }
      })
      .on('end', () => resolve({ type: 'FeatureCollection', features }))
      .on('error', reject);
  });
}
