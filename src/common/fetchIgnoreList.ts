import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import csv from 'csv-parser';
import { type IgnoreFile, mock } from '../preprocess/const.js';

export const spreadsheetId = '1BNrUQof78t-OZlCHF3n_MKnYDARFoCRZB7xKxQPmKds';

export async function fetchIgnoreList(
  gId: number,
  columnName: string,
): Promise<IgnoreFile> {
  const stream = mock
    ? createReadStream(
        join(import.meta.dirname, '../__tests__/mock/ignore-list.csv'),
      )
    : await fetch(
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gId}`,
      )
        .then((r) => r.body!)
        .then(Readable.fromWeb);

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
