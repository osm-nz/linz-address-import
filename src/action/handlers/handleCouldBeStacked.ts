import { promises as fs } from 'fs';
import { join } from 'path';
import { toStackId } from '../../common';
import { OsmId, Status, StatusReport } from '../../types';
import { outFolder } from '../util';

type BySuburb = {
  [suburb: string]: {
    [addr: string]: {
      meta: string | number;
      osmIds: OsmId[];
      linzIds: string[];
    };
  };
};

export async function handleCouldBeStacked(
  arr: StatusReport[Status.COULD_BE_STACKED],
): Promise<void> {
  let report = '';

  const bySuburb = arr.reduce((_ac, [linzId, [osmId, suburb, addr, meta]]) => {
    const ac = _ac;
    ac[suburb] ||= {};
    ac[suburb][addr] ||= { meta, osmIds: [], linzIds: [] };
    ac[suburb][addr].osmIds.push(osmId);
    ac[suburb][addr].linzIds.push(linzId);
    return ac;
  }, {} as BySuburb);

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const addr in bySuburb[suburb]) {
      const { meta, osmIds, linzIds } = bySuburb[suburb][addr];

      report += `${meta} flats at\t\t${addr}\t\tcould be stacked instead of ${osmIds.join(
        ',',
      )}\t\t${toStackId(linzIds)}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'could-be-stacked.txt'), report);
}
