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

async function readCsv<T extends Record<string, string>>(
  { idField, tagging, dontFlipWays }: Options<T>,
  input: string,
  IDsToSkip: IgnoreFile,
): Promise<GeoJsonFeature[]> {
  const fullPath = join(__dirname, '../../../data/extra/', input);
  if (!(await existsAsync(fullPath))) {
    console.log(`Skipping ${input} because the LINZ data doesn't exist`);
    return [];
  }

  return new Promise((resolve, reject) => {
    const features: GeoJsonFeature[] = [];

    createReadStream(fullPath)
      .pipe(csv())
      .on('data', (data: T) => {
        // we have to do this because of a special character at position 0,0 in every linz CSV file
        const wktField = Object.keys(data)[0];

        const id =
          idField === 'HASH_WKT' ? hash(data[wktField]) : data[idField];

        if (id in IDsToSkip) return; // skip this one, it's already mapped

        features.push({
          type: 'Feature',
          id,
          geometry: wktToGeoJson(data[wktField], input, true, dontFlipWays),
          properties: tagging(data, id),
        });
      })
      .on('end', () => {
        resolve(features);
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
  tagging: (data: T, id: string) => Record<string, string | undefined>;
  /** if complete: true, this function does nothing. That way the code can be preserved for historical records */
  complete?: true;
};

export function csvToGeoJsonFactory(IDsToSkip: IgnoreFile) {
  return async function csvToGeoJson<T extends Record<string, string>>(
    options: Options<T>,
  ): Promise<ExtraLayers[string]> {
    if (options.complete) return { size: options.size, features: [] };

    const inputs =
      typeof options.input === 'string' ? [options.input] : options.input;

    const f: GeoJsonFeature[][] = [];
    for (const input of inputs) {
      f.push(await readCsv(options, input, IDsToSkip));
    }
    const features = f.flat(1);
    console.log(options.input, features.length);

    return {
      size: options.size,
      features,
      instructions: options.instructions,
    };
  };
}
