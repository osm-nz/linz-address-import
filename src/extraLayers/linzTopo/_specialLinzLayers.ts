import { createReadStream, promises as fs } from 'node:fs';
import { join } from 'node:path';
import { F_OK } from 'node:constants';
import csv from 'csv-parser';
import type { Query } from 'which-polygon';
import type {
  ChunkSize,
  ExtraLayers,
  GeoJsonCoords,
  GeoJsonFeature,
  Tags,
} from '../../types.js';
import type { IgnoreFile } from '../../preprocess/const.js';
import { getFirstCoord, hash } from '../../common/index.js';
import { wktToGeoJson } from './geoOperations/index.js';
import { type Chart, getBestChart } from './seamarkTagging/index.js';

const existsAsync = (path: string) =>
  fs
    .access(path, F_OK)
    .then(() => true)
    .catch(() => false);

async function readCsv<T extends Record<string, string>>(
  { idField, tagging, dontFlipWays, transformGeometry }: Options<T>,
  input: string,
  IDsToSkip: IgnoreFile,
  charts: Query<Chart>,
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
        const idWithType = isNautical ? `h${+id || id}` : `t${id}`;

        if (idWithType in IDsToSkip) return; // skip this one, it's already mapped

        let geometry = wktToGeoJson(data[wktField], input, true, dontFlipWays);

        let chartName;
        // for seamarks, make sure we only use features from the best nautical chart for this location
        if (isNautical) {
          // TODO: this is unreliable because a huge feature might span multiple charts,
          // and we don't use the centroid, we use the first coord.
          const centroid = getFirstCoord(geometry);
          let bestChartForThisLoc = getBestChart(
            charts,
            centroid[1],
            centroid[0],
          );

          // this will never happen
          if (!bestChartForThisLoc) {
            console.log('NO CHART FOR', centroid, input);

            // we'll allow it through if this happens
            bestChartForThisLoc = {
              encChartName: 'Unknown',
              category: '14k-122k',
              rank: 0,
            };
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

        let tags = tagging(data, id, chartName, geometry.type);
        if (!tags) return; // skip, the tagging fuction doesn't want this feature included

        if (transformGeometry) {
          const result = transformGeometry(geometry, tags);
          if (!result) return; // skip, the transform function doesn't want this feature included
          [geometry, tags] = result;
        }

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
    geometryType: GeoJsonCoords['type'],
  ) => Tags | null;
  /** if complete: true, this function does nothing. That way the code can be preserved for historical records */
  complete?: true;
  /**
   * an optional function to transform the geometry of every feature in this layer
   * return null to skip this feature
   */
  transformGeometry?(
    originalGeom: GeoJsonCoords,
    tags: Tags,
  ): null | [GeoJsonCoords, Tags];
};

export function csvToGeoJsonFactory(
  IDsToSkip: IgnoreFile,
  charts: Query<Chart>,
) {
  return async function csvToGeoJson<T extends Record<string, string>>(
    options: Options<T>,
  ): Promise<ExtraLayers[string]> {
    if (options.complete) return { size: options.size, features: [] };

    const inputs =
      typeof options.input === 'string' ? [options.input] : options.input;

    let totalSkipped = 0;

    // temporarily store as an object to remove any remaining duplicates
    const f: Record<string, GeoJsonFeature> = {};
    for (const input of inputs) {
      const { features, skipped } = await readCsv(
        options,
        input,
        IDsToSkip,
        charts,
      );
      for (const feat of features) f[feat.id] = feat;

      totalSkipped += skipped;
    }
    const features = Object.values(f);

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
