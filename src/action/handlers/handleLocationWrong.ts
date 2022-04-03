import { promises as fs } from 'fs';
import { join } from 'path';
import {
  Status,
  StatusReport,
  HandlerReturn,
  GeoJsonFeature,
  CheckDate,
} from '../../types';
import { outFolder, toLink } from '../util';

export async function handleLocationWrong(
  arr: StatusReport[Status.EXISTS_BUT_LOCATION_WRONG],
): Promise<HandlerReturn> {
  const features: GeoJsonFeature[] = [];
  let report = '';

  for (const [linzId, d] of arr) {
    const [metres, osmData, lat, lng, wrongLat, wrongLng] = d;
    report += `${linzId}\t\t${toLink(
      osmData.osmId,
    )}\t\tneeds to move ${metres}m to ${lat},${lng}\n`;

    if (osmData.osmId[0] === 'n') {
      // RapiD can only move nodes.
      features.push({
        type: 'Feature',
        id: osmData.osmId,
        geometry: {
          type: 'LineString',
          coordinates: [
            [wrongLng, wrongLat],
            [lng, lat],
          ],
        },
        properties: {
          __action: 'move',

          // maybe remove the check_date tag if it's out-of-date
          // TODO: unfortunately RapiD can't edit tags at the same time as a move, so this won't work
          ...(osmData.checked === CheckDate.YesExpired && { check_date: '🗑️' }),
        },
      });
    }
  }

  await fs.writeFile(join(outFolder, 'location-wrong.txt'), report);

  return { 'Address Update': features };
}
