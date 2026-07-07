import { createReadStream, promises as fs } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import type { LinzData, LinzSourceAddress } from '../types.js';
import { nzgbNamesTable } from '../common/nzgbFile.js';
import { linzCsvFile, linzTempFile } from './const.js';

// TODO: shouldn't OpenAddresses fix this?
/** LINZ's longitude values go >180 e.g. 183deg which is invalid. It should be -177 */
const correctLng = (lng: number) => {
  if (lng < 180) return lng;
  return lng - 360;
};

/**
 * the format is always "1/23A" (where prefix=1, mainNum=23, suffix=A).
 * We manually construct this instead of using full_address_number because
 * that field uses odd values like "Flat 1, 23" and "Unit 1, 23A".
 * count: Flat(12358), Unit(3558), Apartment(655), Villa(200), Shop(35), Suite(10)
 */
const convertUnit = (prefix: string, mainNumber: string) => {
  if (prefix) return `${prefix}/${mainNumber}`;
  return mainNumber;
};

const preferOfficialName = (name: string) => nzgbNamesTable[name] || name;

// TODO: perf baseline is 50seconds
async function linzToJson(): Promise<LinzData> {
  console.log('Starting preprocess of LINZ data...');
  const out: LinzData = {};
  let index = 0;

  const fileStream = createReadStream(linzCsvFile);
  const rl = createInterface({ input: fileStream });

  for await (const line of rl) {
    const data: LinzSourceAddress = JSON.parse(line);

    // skip addresses where mappers clicked ignore
    if (!data.properties) continue;

    const [lng, lat] = data.geometry.coordinates;

    out[data.properties.id] = {
      id: data.properties.id,
      housenumber: convertUnit(data.properties.unit, data.properties.number),
      // OpenAddresses doesn't give us the raw housenumber components,
      // so we need to crudely split `1/2-3A` back into `2-3` (the
      // 'most significant bit')
      $houseNumberMsb: data.properties.number.replace(/[A-Z]+$/, ''),
      street: data.properties.street,
      suburb: preferOfficialName(data.properties.city),
      town: preferOfficialName(data.properties.district),
      lat,
      lng: correctLng(lng),
    };
    if (data.properties.is_land === 'F') out[data.properties.id].water = true;

    index += 1;
    if (!(index % 1000)) process.stdout.write('.');
  }

  return out;
}

export async function main(): Promise<void> {
  const result = await linzToJson();
  await fs.writeFile(linzTempFile, JSON.stringify(result));
}

if (process.env.NODE_ENV !== 'test') main();
