import { promises as fs, createReadStream } from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { nzgbFile } from './const';

type NZGBFile = {
  locality_id: number;
  locality_name: string;
  name_occurrence: string;
  official_placename: string;
  has_macron: 'T' | 'F';
};

export async function processNZGBList(): Promise<Record<string, string>> {
  const stream = createReadStream(
    join(
      __dirname,
      '../../static/fire-and-emergency-nz-localities-nzgb-compliant-names.csv',
    ),
  );
  return new Promise((resolve, reject) => {
    /** map of incorrect name to correct name */
    const out: Record<string, string> = {};

    stream
      .pipe(csv())
      .on('data', (data: NZGBFile) => {
        out[data.locality_name] = data.official_placename;
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const res = await processNZGBList();
  await fs.writeFile(nzgbFile, JSON.stringify(res, null, 2));
}

if (process.env.NODE_ENV !== 'test') main();
