import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleMultipleExistButNoLinzRef(
  arr: StatusReport[Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF],
): Promise<void> {
  let report = '';
  for (const [linzId, osmIds] of arr) {
    report += `ref:linz:address_id=${linzId}\t\tneeds to be added to\t\t${osmIds
      .map((v) => `${toLink(v[1])} (${v[0]})`)
      .join('\t')}\n`;
  }

  await fs.writeFile(
    join(outFolder, 'needs-linz-ref-but-multiple.txt'),
    report,
  );
}
