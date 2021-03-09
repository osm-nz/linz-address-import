import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleExistsButNoLinzRef(
  arr: StatusReport[Status.EXISTS_BUT_NO_LINZ_REF],
): Promise<void> {
  let report = '';
  for (const [linzId, [confidence, osmId]] of arr) {
    report += `ref:linz:address_id=${linzId}\t\t(${confidence})needs to be added to\t\t${toLink(
      osmId,
    )}\n`;
  }

  await fs.writeFile(join(outFolder, 'needs-linz-ref.txt'), report);
}
