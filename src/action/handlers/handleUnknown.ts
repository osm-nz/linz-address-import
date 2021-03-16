import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleUnknown(
  arr: StatusReport[Status.UNKNOWN_ERROR],
): Promise<void> {
  let report = '';
  for (const [linzId, osmId] of arr) {
    report += `${linzId}\t\t${toLink(osmId)}\t\tcould not be processed\n`;
  }

  await fs.writeFile(join(outFolder, 'unknown-error.txt'), report);
}
