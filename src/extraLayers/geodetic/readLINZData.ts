import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import csv from 'csv-parser';
import type { BBox } from '../../types.js';
import { withinBBox } from '../../common/index.js';
import {
  type LINZCSVItem,
  type LINZMarker,
  beaconTypes,
  markConditions,
} from './const.js';

type Structure = false | [string, string?, string?];

export function csvToMarker(
  marker: LINZCSVItem,
  includeNonBeaconed: boolean,
): LINZMarker | undefined {
  const condition = markConditions[marker.mark_condition];
  if (condition === false) return undefined;

  let $structure = beaconTypes[marker.beacon_type] as Structure;

  if (!$structure) {
    if (includeNonBeaconed) $structure ||= ['pin', undefined, undefined];
    else return undefined;
  }

  const [structure, height, material] = $structure;

  return {
    lat: +marker.latitude,
    lng: +marker.longitude,
    description:
      // make all multi-spaces/tabs/newlines into single space
      marker.description.replaceAll(/\s\s+/g, ' ').slice(0, 255).trim() ||
      undefined,
    ele: marker.ellipsoidal_height || undefined,
    name: marker.current_mark_name?.trim(),
    'survey_point:structure': structure,
    height,
    material,
    'survey_point:datum_aligned': condition || undefined,
    'survey_point:purpose': marker.ellipsoidal_height ? 'both' : 'horizontal',
  };
}

export async function readLINZData(
  bbox: BBox,
  ignore: string[],
): Promise<Record<string, LINZMarker>> {
  console.log('Extracting survey markers from LINZ csv file...');

  const alreadyWarnedAbout1: Record<string, true> = {};
  const alreadyWarnedAbout2: Record<string, true> = {};

  const csvFile = join(import.meta.dirname, '../../../data/geodetic-marks.csv');

  let skipped = 0;

  return new Promise((resolve, reject) => {
    const out: Record<string, LINZMarker> = {};
    createReadStream(csvFile)
      .pipe(csv())
      .on('data', (marker: LINZCSVItem) => {
        if (!withinBBox(bbox, +marker.latitude, +marker.longitude)) {
          skipped += 1;
          return;
        }

        if (ignore.includes(marker.geodetic_code)) return;

        if (!(marker.beacon_type in beaconTypes)) {
          if (!alreadyWarnedAbout1[marker.beacon_type]) {
            console.warn(
              '\t(!) Skipped marker with unknown beacon_type:',
              marker.beacon_type,
            );
          }
          alreadyWarnedAbout1[marker.beacon_type] = true;
          return;
        }

        if (!(marker.mark_condition in markConditions)) {
          if (!alreadyWarnedAbout2[marker.mark_condition]) {
            console.warn(
              '\t(!) Skipped marker with unknown mark_condition:',
              marker.mark_condition,
            );
          }
          alreadyWarnedAbout2[marker.mark_condition] = true;

          return;
        }

        if (
          // more efficient than a regex?
          marker.description.toLowerCase().includes('topmark') ||
          marker.description.toLowerCase().includes('top-mark') ||
          marker.description.toLowerCase().includes('topmmark')
        ) {
          return; // a floating beacon in the sea
        }

        const m = csvToMarker(marker, false);
        if (m) out[marker.geodetic_code] = m;
      })
      .on('end', () => {
        console.log(
          `Read ${
            Object.keys(out).length
          } markers from LINZ, skipped ${skipped}`,
        );
        resolve(out);
      })
      .on('error', reject);
  });
}
