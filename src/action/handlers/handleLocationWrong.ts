import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  CheckDate,
  type HandlerReturn,
  type Status,
  type StatusReport,
} from '../../types.js';
import { LAYER_PREFIX, outFolder, toLink } from '../util/index.js';

export async function handleLocationWrong(
  array: StatusReport[Status.EXISTS_BUT_LOCATION_WRONG],
): Promise<HandlerReturn> {
  const features: HandlerReturn = {};

  const bySuburb = array.reduce(
    (ac, [linzId, [suburb, ...other]]) => {
      ac[suburb] ||= [];
      ac[suburb].push([linzId, ...other]);
      return ac;
    },
    {} as {
      [
        suburb: string
      ]: StatusReport[Status.EXISTS_BUT_LOCATION_WRONG][number][1][];
    },
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    // eslint-disable-next-line unicorn/no-unreadable-array-destructuring
    for (const [linzId, metres, osmData, lat, lng, , , isMinorMove] of bySuburb[
      suburb
    ]) {
      report += `${linzId}\t\t${toLink(
        osmData.osmId,
      )}\t\tneeds to move ${metres}m to ${lat},${lng}${isMinorMove ? ' *' : ''}\n`;
    }
  }

  for (const [, d] of array) {
    const [suburb, , osmData, lat, lng, wrongLat, wrongLng, isMinorMove] = d;
    if (osmData.osmId[0] === 'n') {
      // RapiD can only move nodes.
      const layer = isMinorMove
        ? 'Slighly shift addresses'
        : LAYER_PREFIX + suburb;
      features[layer] ||= [];
      features[layer].push({
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

  return features;
}
