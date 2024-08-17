import { config as dotenv } from 'dotenv';
import type { BBox } from '../../types.js';
import { conflate } from './conflate.js';
import { readFromPlanet } from './readFromPlanet.js';
import { readLINZData } from './readLINZData.js';

dotenv();

const bbox: BBox = {
  minLng: 165.7017633330705,
  maxLng: 179.99,
  maxLat: -33.69935009108119,
  minLat: -47.715720315048664,
};

const ignore: string[] = [
  'F31E', // duplicate of A3XP
];

/**
 * input files: data/geodetic-marks.csv and data/osm.pbf
 */
export async function geodetic(): Promise<void> {
  const linzData = await readLINZData(bbox, ignore);
  const osmData = await readFromPlanet(bbox);

  await conflate(linzData, osmData);
}
