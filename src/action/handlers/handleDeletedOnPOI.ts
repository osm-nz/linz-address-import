import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { OsmAddr, Status, StatusReport } from '../../types.js';
import { outFolder, toLink } from '../util/index.js';

export async function handleDeletedOnPOI(
  array: StatusReport[Status.NEEDS_DELETE_NON_TRIVIAL],
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
      report += `${linzId}\t\tneeds deleting but is on a POI\t\t${toLink(
        osmAddr.osmId,
      )}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'needs-delete-non-trivial.txt'), report);
}
