import { config as dotenv } from 'dotenv';
import { conflate } from './conflate';
import { readFromPlanet } from './readFromPlanet';
import { readLINZData } from './readLINZData';

dotenv();

/**
 * input files: data/geodetic-marks.csv and data/osm.pbf
 */
export async function geodetic(): Promise<void> {
  const linzData = await readLINZData();
  const osmData = await readFromPlanet();

  await conflate(linzData, osmData);
}
