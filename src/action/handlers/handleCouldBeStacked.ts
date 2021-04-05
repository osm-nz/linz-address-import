import { promises as fs } from 'fs';
import { join } from 'path';
import { OsmId, Status, StatusReport } from '../../types';
import { outFolder } from '../util';

type BySuburb = {
  [suburb: string]: {
    [addr: string]: { meta: string | number; osmIds: OsmId[] };
  };
};

export async function handleCouldBeStacked(
  arr: StatusReport[Status.COULD_BE_STACKED],
): Promise<void> {
  let report = '';

  const bySuburb = arr.reduce((_ac, [, [osmId, suburb, addr, meta]]) => {
    const ac = _ac;
    ac[suburb] ||= {};
    ac[suburb][addr] ||= { meta, osmIds: [] };
    ac[suburb][addr].osmIds.push(osmId);
    return ac;
  }, {} as BySuburb);

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const addr in bySuburb[suburb]) {
      const { meta, osmIds } = bySuburb[suburb][addr];

      report += `${meta} flats at\t\t${addr}\t\tcould be stacked instead of ${osmIds.join(
        ',',
      )}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'could-be-stacked.txt'), report);
}
