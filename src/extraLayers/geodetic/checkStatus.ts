import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import csv from 'csv-parser';
import type { LINZCSVItem, LINZMarker } from './const.js';
import { csvToMarker } from './readLINZData.js';

const execAsync = promisify(exec);

const head =
  'WKT,id,geodetic_code,current_mark_name,description,mark_type,beacon_type,mark_condition,order,land_district,latitude,longitude,ellipsoidal_height,shape_X,shape_Y'.split(
    ',',
  );

async function processLine(line: string) {
  return new Promise<LINZMarker | 'DESTROYED'>((resolve) => {
    Readable.from([line])
      .pipe(csv(head))
      .on('data', (marker: LINZCSVItem) =>
        resolve(csvToMarker(marker, true) || 'DESTROYED'),
      );
  });
}

/** re-checks an individual survey marker. More perforant than processing every single pin in NZ */
export async function checkStatus(
  code: string,
): Promise<
  { isDestroyed: true } | { isDestroyed: false; linzMarker: LINZMarker }
> {
  try {
    const { stdout, stderr } = await execAsync(
      `cat data/geodetic-marks.csv | grep ,${code},`,
    );
    csv();
    if (stderr) throw new Error(`Child: ${stderr}`);
    const output = stdout
      .split('\r\n')
      .filter(Boolean)
      .find((x) => x.split(',')[2] === code);

    if (!output) {
      console.log(`Something went wrong with ${code}. It will be deleted`);
      return { isDestroyed: true };
    }

    const linzMarker = await processLine(output);
    if (linzMarker === 'DESTROYED') return { isDestroyed: true };

    return { isDestroyed: false, linzMarker };
  } catch {
    console.log(`Failed to find ${code} using grep. It will be deleted`);
    return { isDestroyed: true };
  }
}
