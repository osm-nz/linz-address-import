import { promises as fs, createReadStream } from 'fs';
import fetch from 'node-fetch';
import csv from 'csv-parser';
import { join } from 'path';
import { ignoreFile, IgnoreFile, mock } from './const';

export async function fetchIgnoreList(
  gId = 0,
  columnName = 'LINZ Address ID',
): Promise<IgnoreFile> {
  const stream = mock
    ? createReadStream(join(__dirname, '../__tests__/mock/ignore-list.csv'))
    : await fetch(
        `https://docs.google.com/spreadsheets/d/1BNrUQof78t-OZlCHF3n_MKnYDARFoCRZB7xKxQPmKds/export?format=csv&gid=${gId}`,
      ).then((r) => r.body!);

  return new Promise((resolve, reject) => {
    /** list of LINZ refs */
    const out: IgnoreFile = {};

    stream
      .pipe(csv({ skipLines: 2 }))
      .on('data', (data) => {
        out[data[columnName]] = 1;
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const res = await fetchIgnoreList();
  await fs.writeFile(ignoreFile, JSON.stringify(res));
}

if (process.env.NODE_ENV !== 'test') main();
