import { createReadStream } from 'node:fs';
import csv from 'csv-parser';
import { Query } from 'which-polygon';
import { join } from 'node:path';
import { GeoJson, GeoJsonFeature } from '../../../types';
import { fixChartName } from './helpers';
import { wktToGeoJson } from '../geoOperations';

const filePath = join(
  __dirname,
  '../../../../data/extra/nz-electronic-navigational-chart-enc-index.csv',
);

type ChartIndexCsv = {
  WKT: string;
  product_id: string;
  version_id: string;
  usage:
    | 'Overview'
    | 'General'
    | 'Coastal'
    | 'Approach'
    | 'Harbour'
    | 'Berthing';
  usage_fil: string;
  enc_no: string;
  enc_name: string;
  edn_no: string;
  upd_no: string;
  upd_date: string;
  comp_scale: string;
  min_x: string;
  min_y: string;
  max_x: string;
  max_y: string;
  edn_date: string;
  region: string;
};

export type Chart = {
  // category/scale that this chart fits under
  category:
    | '14k-122k'
    | '122k-190k'
    | '190k-1350k'
    | '1350k-11500k'
    | '115mil-and-smaller';
  rank: number;
  encChartName: string; // these don't match the charts we're used to in NZ (e.g. Akl Harbour East)
};

const MAP: Record<
  ChartIndexCsv['usage'],
  [rank: number, size: Chart['category']]
> = {
  Berthing: [0, '14k-122k'], // in terms of csv files, these are combined with Harbour
  Harbour: [1, '14k-122k'],
  Approach: [2, '122k-190k'],
  Coastal: [3, '190k-1350k'],
  General: [4, '1350k-11500k'],
  Overview: [5, '115mil-and-smaller'],
};

export async function readNauticalChartIndexCsv(): Promise<GeoJson<Chart>> {
  return new Promise((resolve, reject) => {
    const features: GeoJsonFeature<Chart>[] = [];

    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: ChartIndexCsv) => {
        const map = MAP[data.usage];
        if (!map) {
          console.log('Skipped chart with invalid usage', [
            data.usage,
            data.enc_name,
          ]);
          return;
        }

        // we have to do this because of a special character at position 0,0 in every linz CSV file
        const wktField = <'WKT'>Object.keys(data)[0];

        // so not include the 'sea/' prefix in the layer name, since we don't want to
        // mess with the antimeridian for the chart index itself.
        const geometry = wktToGeoJson(data[wktField], 'chart-indexes');

        const encChartName = fixChartName(data.enc_name);
        features.push({
          type: 'Feature',
          geometry,
          id: encChartName,
          properties: {
            encChartName,
            category: map[1],
            rank: map[0],
          },
        });
      })
      .on('end', () => resolve({ type: 'FeatureCollection', features }))
      .on('error', reject);
  });
}

export function getBestChart(
  query: Query<Chart>,
  lat: number,
  lng: number,
): Chart | undefined {
  // we query twice in the rare case that the first query fails,
  // because which-polygon treats -170lng as a different location to +190lng.
  const temp = query([lng, lat], true) || query([360 + lng, lat], true);

  if (!temp) return undefined; // will never happen

  // fill it into an array based on it's rank to remove duplicates from the same rank
  const possibleCharts: Chart[] = [];
  for (const c of temp) possibleCharts[c.rank] = c;

  return possibleCharts.find(Boolean); // this assumes that find() executes in a consistent order
}
