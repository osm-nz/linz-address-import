import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { OsmAddr, Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleDeleted(
  array: StatusReport[Status.NEEDS_DELETE],
): Promise<void> {
  const bySuburb = array.reduce(
    (ac, [linzId, [suburb, osmAddr]]) => {
      ac[suburb] ||= [];
      ac[suburb].push([linzId, osmAddr]);
      return ac;
    },
    {} as Record<string, [string, OsmAddr][]>,
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, osmAddr] of bySuburb[suburb]) {
      report += `${linzId}\t\tneeds deleting\t\t${toLink(osmAddr.osmId)}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'needs-delete.txt'), report);
}
