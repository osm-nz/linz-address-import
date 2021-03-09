import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleLocationWrong(
  arr: StatusReport[Status.EXISTS_BUT_LOCATION_WRONG],
): Promise<void> {
  let report = '';
  for (const [linzId, d] of arr) {
    const [metres, osmId, lat, lng] = d;
    report += `${linzId}\t\t${toLink(
      osmId,
    )}\t\tneeds to move ${metres}m to ${lat},${lng}\n`;
  }

  await fs.writeFile(join(outFolder, 'location-wrong.txt'), report);
}
