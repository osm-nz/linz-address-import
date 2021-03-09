import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleDuplicateLinzRef(
  arr: StatusReport[Status.MULTIPLE_EXIST],
): Promise<void> {
  let report = '';
  for (const [linzId, osmIdList] of arr) {
    report += `${linzId}\t\texists on ${osmIdList.map(toLink).join(' and ')}\n`;
  }

  await fs.writeFile(join(outFolder, 'duplicate-linz-ref.txt'), report);
}
