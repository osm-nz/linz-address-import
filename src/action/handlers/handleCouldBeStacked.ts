import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { toStackId } from '../../common/index.js';
import type { OsmId, Status, StatusReport } from '../../types.js';
import { outFolder } from '../util/index.js';

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
  array: StatusReport[Status.COULD_BE_STACKED],
): Promise<void> {
  let report = '';

  const bySuburb = array.reduce(
    (_ac, [linzId, [osmId, suburb, addr, meta]]) => {
      const ac = _ac;
      ac[suburb] ||= {};
      ac[suburb][addr] ||= { meta, osmIds: [], linzIds: [] };
      ac[suburb][addr].osmIds.push(osmId);
      ac[suburb][addr].linzIds.push(linzId);
      return ac;
    },
    {} as BySuburb,
  );

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
