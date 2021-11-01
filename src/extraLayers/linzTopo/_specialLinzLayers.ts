import { promises as fs, createReadStream } from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { F_OK } from 'constants';
import { ChunkSize, ExtraLayers, GeoJsonFeature } from '../../types';
import { wktToGeoJson } from './wktToGeoJson';
import { IgnoreFile } from '../../preprocess/const';
import { getFirstCoord, hash } from '../../common';
import { Chart, getBestChart } from './seamarkTagging';

const existsAsync = (path: string) =>
  fs
    .access(path, F_OK)
    .then(() => true)
    .catch(() => false);

async function readCsv<T extends Record<string, string>>(
  { idField, tagging, dontFlipWays }: Options<T>,
  input: string,
  IDsToSkip: IgnoreFile,
  charts: Chart[],
): Promise<{ features: GeoJsonFeature[]; skipped: number }> {
  const fullPath = join(__dirname, '../../../data/extra/', input);
  if (!(await existsAsync(fullPath))) {
    console.log(`Skipping ${input} because the LINZ data doesn't exist`);
    return { features: [], skipped: 0 };
  }
  const isNautical = input.startsWith('sea/');

  return new Promise((resolve, reject) => {
    const features: GeoJsonFeature[] = [];
    let skipped = 0;

    createReadStream(fullPath)
      .pipe(csv())
      .on('data', (data: T) => {
        // we have to do this because of a special character at position 0,0 in every linz CSV file
        const wktField = Object.keys(data)[0];

        const id =
          idField === 'HASH_WKT' ? hash(data[wktField]) : data[idField];
        const type = isNautical ? 'h' : 't';

        if (type + id in IDsToSkip) return; // skip this one, it's already mapped

        const geometry = wktToGeoJson(
          data[wktField],
          input,
          true,
          dontFlipWays,
        );

        let chartName;
        // for seamarks, make sure we only use features from the best nautical chart for this location
        if (isNautical) {
          // TODO: this is unreliable because a huge feature might span multiple charts,
          // and we don't use the centroid, we use the first coord.
          const centroid = getFirstCoord(geometry);
          const bestChartForThisLoc = getBestChart(
            charts,
            centroid[1],
            centroid[0],
          );

          // this will never happen
          if (!bestChartForThisLoc) {
            console.log('NO CHART FOR', centroid);
            return;
          }

          const isBestChartForThisLoc = fullPath.includes(
            bestChartForThisLoc.category,
          );

          if (!isBestChartForThisLoc) {
            // if there are more detailed charts available for this location,
            // don't add this feature.
            skipped += 1;
            return;
          }
          chartName = bestChartForThisLoc.encChartName;
        }

        const tags = tagging(data, id, chartName);
        if (!tags) return; // skip, the tagging fuction doesn't want this feature included

        features.push({
          type: 'Feature',
          id,
          geometry,
          properties: tags,
        });
      })
      .on('end', () => {
        resolve({ features, skipped });
      })
      .on('error', reject);
  });
}

type Options<T> = {
  input: string | string[];
  size: ChunkSize;
  instructions?: string;
  idField: keyof T | 'HASH_WKT';
  sourceLayer: string;
  dontFlipWays?: true;
  tagging: (
    data: T,
    id: string,
    chartName: string | undefined,
  ) => Record<string, string | undefined> | null;
  /** if complete: true, this function does nothing. That way the code can be preserved for historical records */
  complete?: true;
};

export function csvToGeoJsonFactory(IDsToSkip: IgnoreFile, charts: Chart[]) {
  return async function csvToGeoJson<T extends Record<string, string>>(
    options: Options<T>,
  ): Promise<ExtraLayers[string]> {
    if (options.complete) return { size: options.size, features: [] };

    const inputs =
      typeof options.input === 'string' ? [options.input] : options.input;

    let totalSkipped = 0;
    const f: GeoJsonFeature[][] = [];
    for (const input of inputs) {
      const { features, skipped } = await readCsv(
        options,
        input,
        IDsToSkip,
        charts,
      );
      f.push(features);
      totalSkipped += skipped;
    }
    const features = f.flat(1);

    console.log(
      inputs[0].split('-po')[0],
      features.length,
      'skipped',
      totalSkipped,
    );

    return {
      size: options.size,
      features,
      instructions: options.instructions,
    };
  };
}
