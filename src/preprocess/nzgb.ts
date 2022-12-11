import { promises as fs, createReadStream } from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { mock, nzgbFile } from './const';

type FireBrigadeFile = {
  locality_id: number;
  locality_name: string;
  name_occurrence: string;
  official_placename: string;
  has_macron: 'T' | 'F';
};
type NZGBFile = { id: string; name: string };

function consumeStream<T>(path: string, callback: (item: T) => void) {
  const stream = createReadStream(path);
  return new Promise((resolve, reject) => {
    stream
      .pipe(csv())
      .on('data', callback)
      .on('end', resolve)
      .on('error', reject);
  });
}

/**
 * we look at both the Fire & Emergency table, and the NZGB table because the
 * Fire & Emergency table is missing some (e.g. Wānaka).
 */
export async function processNZGBList(): Promise<Record<string, string>> {
  const nzgbTableFile = join(
    __dirname,
    mock ? '../__tests__/mock/nzgb-table.csv' : '../../static/nzgb-table.csv',
  );

  const fireBrigadeFile = join(
    __dirname,
    '../../static/fire-and-emergency-nz-localities-nzgb-compliant-names.csv',
  );

  /** map of incorrect name to correct name */
  const out: Record<string, string> = {};

  await consumeStream<NZGBFile>(nzgbTableFile, (data) => {
    const withoutMacrons = data.name
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
    out[withoutMacrons] = data.name;
  });

  await consumeStream<FireBrigadeFile>(fireBrigadeFile, (data) => {
    out[data.locality_name] = data.official_placename;
  });

  // delete a couple of false positives, in cases where there are two
  // places with the same name, but only one uses a tohutō
  delete out.Waihopai;
  delete out.Manapouri;
  delete out.Omarama;
  delete out.Kakanui;
  delete out.Kairakau;
  delete out.Otamatea;
  delete out.Pomare;
  delete out.Manawahe;
  delete out.Pakaraka;
  delete out.Orongo;
  delete out['Te Kowhai'];

  return out;
}

export async function main(): Promise<void> {
  const res = await processNZGBList();
  await fs.writeFile(nzgbFile, JSON.stringify(res, null, 2));
}

if (process.env.NODE_ENV !== 'test') main();
