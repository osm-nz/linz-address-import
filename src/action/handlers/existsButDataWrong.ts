import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function existsButDataWrong(
  arr: StatusReport[Status.EXISTS_BUT_WRONG_DATA],
): Promise<void> {
  let report = '';
  for (const [linzId, [osmId, ...issues]] of arr) {
    // const [key, wrong, right] = issue.split('|');
    report += `${linzId}\t\t${toLink(osmId)}\t\t${issues.join('\tand\t')}\n`;
  }

  await fs.writeFile(join(outFolder, 'data-wrong.txt'), report);
}
