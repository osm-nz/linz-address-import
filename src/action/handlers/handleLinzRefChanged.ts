import { promises as fs } from 'fs';
import { join } from 'path';
import { OsmAddr, Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleLinzRefChanged(
  arr: StatusReport[Status.LINZ_REF_CHANGED],
): Promise<void> {
  const bySuburb = arr.reduce(
    (ac, [oldLinzId, [suburb, newLinzId, osmAddr]]) => {
      // eslint-disable-next-line no-param-reassign -- mutation is cheap
      ac[suburb] ||= [];
      ac[suburb].push([oldLinzId, newLinzId, osmAddr]);
      return ac;
    },
    {} as Record<string, [string, string, OsmAddr][]>,
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [oldLinzId, newLinzId, osmAddr] of bySuburb[suburb]) {
      report += `${oldLinzId}\t->\t${newLinzId}\t\t${toLink(osmAddr.osmId)}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'linz-ref-changed.txt'), report);
}