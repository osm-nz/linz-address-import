import { promises as fs } from 'fs';
import { join } from 'path';
import { OsmAddr, Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

export async function handleDeletedOnBuilding(
  arr: StatusReport[Status.NEEDS_DELETE_BUILDING],
): Promise<void> {
  const bySuburb = arr.reduce((ac, [linzId, [suburb, osmAddr]]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, osmAddr]);
    return ac;
  }, {} as Record<string, [string, OsmAddr][]>);

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, osmAddr] of bySuburb[suburb]) {
      report += `${linzId}\t\tneeds deleting but is on a building\t\t${toLink(
        osmAddr.osmId,
      )}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'needs-delete-building.txt'), report);
}
