import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';
import { LinzSourceAddress, LinzData } from '../types';
import { linzTempFile, mock, ignoreFile, IgnoreFile, nzgbFile } from './const';

const input = join(
  __dirname,
  mock ? '../__tests__/mock/linz-dump.csv' : '../../data/linz.csv',
);

/** LINZ's longitude values go >180 e.g. 183deg which is invalid. It should be -177 */
const correctLng = (lng: number) => {
  // we could do `((lng + 180) % 360) - 180` but this is computationally cheaper
  if (lng < 180) return lng;
  return lng - 360;
};

// TODO: perf baseline is 50seconds
async function linzToJson(): Promise<LinzData> {
  console.log('Reading ignore file...');
  const ignore: IgnoreFile = JSON.parse(await fs.readFile(ignoreFile, 'utf-8'));

  console.log('Reading NZGB file...');
  const nzgb: Record<string, string> = JSON.parse(
    await fs.readFile(nzgbFile, 'utf-8'),
  );
  const useOfficialName = (name: string) => nzgb[name] || name;

  console.log('Starting preprocess of LINZ data...');
  return new Promise((resolve, reject) => {
    const out: LinzData = {};
    let i = 0;

    createReadStream(input)
      .pipe(csv())
      .on('data', (data: LinzSourceAddress) => {
        // skip addresses where mappers clicked ignore
        if (ignore[data.address_id]) return;

        out[data.address_id] = {
          housenumber: data.full_address_number,
          $houseNumberMsb: data.address_number,
          street: data.full_road_name,
          suburb: [
            data.town_city ? 'U' : 'R',
            useOfficialName(data.water_name || data.suburb_locality),
          ],
          town: useOfficialName(data.town_city),
          lat: +data.shape_Y,
          lng: correctLng(+data.shape_X),
        };
        if (data.water_name) out[data.address_id].water = true;

        i += 1;
        if (!(i % 1000)) process.stdout.write('.');
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const res = await linzToJson();
  await fs.writeFile(linzTempFile, JSON.stringify(res));
}

if (process.env.NODE_ENV !== 'test') main();
