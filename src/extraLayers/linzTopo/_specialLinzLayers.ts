import { promises as fs, createReadStream } from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { F_OK } from 'constants';
import { GeoJsonFeature } from '../../types';
import { wktToGeoJson } from './wktToGeoJson';
import { IgnoreFile } from '../../preprocess/const';

const existsAsync = (path: string) =>
  fs
    .access(path, F_OK)
    .then(() => true)
    .catch(() => false);

export function csvToGeoJsonFactory(IDsToSkip: IgnoreFile) {
  return async function csvToGeoJson<T extends Record<string, string>>({
    input,
    idField,
    tagging,
    complete,
  }: {
    input: string;
    idField: keyof T | 'USE_ID';
    sourceLayer: string;
    tagging: (data: T, index: number) => Record<string, string | undefined>;
    /** if complete: true, this function does nothing. That way the code can be preserved for historical records */
    complete?: true;
  }): Promise<undefined | GeoJsonFeature[]> {
    if (complete) return undefined;

    const fullPath = join(__dirname, '../../../data/extra/', input);
    if (!(await existsAsync(fullPath))) {
      console.log(`Skipping ${input} because the LINZ data doesn't exist`);
      return undefined;
    }

    return new Promise((resolve, reject) => {
      const features: GeoJsonFeature[] = [];
      let i = 0;

      createReadStream(fullPath)
        .pipe(csv())
        .on('data', (data: T) => {
          i += 1;
          // we have to do this because of a special character at position 0,0 in every linz CSV file
          const wktField = Object.keys(data)[0];

          if (idField !== 'USE_ID' && data[idField] in IDsToSkip) {
            return; // skip this one, it's already mapped
          }

          features.push({
            type: 'Feature',
            id: idField === 'USE_ID' ? `${i}` : data[idField],
            geometry: wktToGeoJson(data[wktField], input),
            properties: tagging(data, i),
          });
        })
        .on('end', () => resolve(features))
        .on('error', reject);
    });
  };
}
