import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { BBox } from '../../../types';
import { withinBBox } from '../../../common';
import { fixChartName } from './helpers';

const filePath = join(
  __dirname,
  '../../../../data/extra/nz-electronic-navigational-chart-enc-index.csv',
);

type ChartIndexCsv = {
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
  bbox: BBox;
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

export async function readNauticalChartIndexCsv(): Promise<Chart[]> {
  return new Promise((resolve, reject) => {
    const features: Chart[] = [];

    createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: ChartIndexCsv) => {
        // TODO: switch to using the WKT, not the BBOX
        const map = MAP[data.usage];
        if (!map) {
          console.log('Skipped chart with invalid usage', [
            data.usage,
            data.enc_name,
          ]);
          return;
        }
        features.push({
          encChartName: fixChartName(data.enc_name),
          category: map[1],
          rank: map[0],
          bbox: {
            maxLat: +data.max_y,
            minLat: +data.min_y,
            maxLng: +data.max_x,
            minLng: +data.min_x,
          },
        });
      })
      .on('end', () => resolve(features))
      .on('error', reject);
  });
}

export function getBestChart(
  charts: Chart[],
  lat: number,
  lng: number,
): Chart | undefined {
  const possibleCharts: Chart[] = [];
  for (const chart of charts) {
    if (withinBBox(chart.bbox, lat, lng)) {
      possibleCharts[chart.rank] = chart;
    }
  }
  return possibleCharts.find((x) => x); // this assumes that find() executes in a consistent order
}
