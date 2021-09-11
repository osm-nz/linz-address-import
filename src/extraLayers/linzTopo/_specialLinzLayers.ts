import { promises as fs, createReadStream } from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { F_OK } from 'constants';
import { ChunkSize, ExtraLayers, GeoJsonFeature } from '../../types';
import { wktToGeoJson } from './wktToGeoJson';
import { IgnoreFile } from '../../preprocess/const';
import { hash } from '../../common';

const existsAsync = (path: string) =>
  fs
    .access(path, F_OK)
    .then(() => true)
    .catch(() => false);

export function csvToGeoJsonFactory(IDsToSkip: IgnoreFile) {
  return async function csvToGeoJson<T extends Record<string, string>>({
    input,
    size,
    instructions,
    idField,
    tagging,
    dontFlipWays,
    complete,
  }: {
    input: string;
    size: ChunkSize;
    instructions?: string;
    idField: keyof T | 'HASH_WKT';
    sourceLayer: string;
    dontFlipWays?: true;
    tagging: (data: T, id: string) => Record<string, string | undefined>;
    /** if complete: true, this function does nothing. That way the code can be preserved for historical records */
    complete?: true;
  }): Promise<ExtraLayers[string]> {
    if (complete) return { size, features: [] };

    const fullPath = join(__dirname, '../../../data/extra/', input);
    if (!(await existsAsync(fullPath))) {
      console.log(`Skipping ${input} because the LINZ data doesn't exist`);
      return { size, features: [] };
    }

    return new Promise((resolve, reject) => {
      const features: GeoJsonFeature[] = [];

      createReadStream(fullPath)
        .pipe(csv())
        .on('data', (data: T) => {
          // we have to do this because of a special character at position 0,0 in every linz CSV file
          const wktField = Object.keys(data)[0];

          const id =
            idField === 'HASH_WKT'
              ? `ant_${hash(data[wktField])}`
              : data[idField];

          if (id in IDsToSkip) return; // skip this one, it's already mapped

          features.push({
            type: 'Feature',
            id,
            geometry: wktToGeoJson(data[wktField], input, true, dontFlipWays),
            properties: tagging(data, id),
          });
        })
        .on('end', () => resolve({ size, features, instructions }))
        .on('error', reject);
    });
  };
}
