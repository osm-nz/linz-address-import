import { createReadStream, promises as fs } from 'node:fs';
import csv from 'csv-parser';
import type {
  AddressId,
  AimAddress,
  LinzData,
  LinzSourceAddress,
  ParcelId,
} from '../types.js';
import { nzgbNamesTable } from '../common/nzgbFile.js';
import {
  type IgnoreFile,
  aimCsvFile,
  ignoreFile,
  linzCsvFile,
  linzTempFile,
} from './const.js';

/** LINZ's longitude values go >180 e.g. 183deg which is invalid. It should be -177 */
const correctLng = (lng: number) => {
  // we could do `((lng + 180) % 360) - 180` but this is computationally cheaper
  if (lng < 180) return lng;
  return lng - 360;
};

/**
 * the format is always "1/23A" (where prefix=1, mainNum=23, suffix=A).
 * We manually construct this instead of using full_address_number because
 * that field uses odd values like "Flat 1, 23" and "Unit 1, 23A".
 * count: Flat(12358), Unit(3558), Apartment(655), Villa(200), Shop(35), Suite(10)
 */
const convertUnit = (
  prefix: string,
  mainNumberLow: string,
  mainNumberHigh: string,
  suffix: string,
) => {
  const mainNumber = mainNumberHigh
    ? `${mainNumberLow}-${mainNumberHigh}`
    : mainNumberLow;

  if (prefix) return `${prefix}/${mainNumber}${suffix}`;
  return mainNumber + suffix;
};

const useOfficialName = (name: string) => nzgbNamesTable[name] || name;

async function aimToJson() {
  console.log('Starting preprocess of AIM data...');
  let index = 0;
  const out: Record<AddressId, ParcelId> = {};

  return new Promise<typeof out>((resolve, reject) => {
    createReadStream(aimCsvFile)
      .pipe(csv())
      .on('data', (data: AimAddress) => {
        out[data.address_id] = data.parcel_id;

        index += 1;
        if (!(index % 1000)) process.stdout.write('.');
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

// TODO: perf baseline is 50seconds
async function linzToJson(): Promise<LinzData> {
  console.log('Reading ignore file...');
  const ignore: IgnoreFile = JSON.parse(await fs.readFile(ignoreFile, 'utf8'));

  console.log('Starting preprocess of AIM data...');
  const addrToParcel = await aimToJson();

  console.log('Starting preprocess of LINZ data...');
  return new Promise((resolve, reject) => {
    const out: LinzData = {};
    let index = 0;

    createReadStream(linzCsvFile)
      .pipe(csv())
      .on('data', (data: LinzSourceAddress) => {
        // skip addresses where mappers clicked ignore
        if (ignore[data.address_id]) return;

        const lat = +data.shape_Y;
        const lng = correctLng(+data.shape_X);

        out[data.address_id] = {
          housenumber: convertUnit(
            data.unit_value,
            data.address_number,
            data.address_number_high,
            data.address_number_suffix,
          ),
          $houseNumberMsb: data.address_number,
          street: data.full_road_name,
          suburb: useOfficialName(data.water_name || data.suburb_locality),
          town: useOfficialName(data.town_city),
          lat,
          lng,
          level: data.level_value || undefined,
          parcelId: addrToParcel[data.address_id],
        };
        if (data.water_name) out[data.address_id].water = true;

        index += 1;
        if (!(index % 1000)) process.stdout.write('.');
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function main(): Promise<void> {
  const result = await linzToJson();
  await fs.writeFile(linzTempFile, JSON.stringify(result));
}

if (process.env.NODE_ENV !== 'test') main();
