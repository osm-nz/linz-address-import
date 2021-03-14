import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport } from '../../types';
import { outFolder, toLink } from '../util';

type ByOsmId = {
  [osmId: string]: string[]; // linzId[]
};

export async function handleCorrupted(
  arr: StatusReport[Status.CORRUPT],
): Promise<void> {
  let report = '';
  const byOsmId = arr.reduce<ByOsmId>((ac, [linzId, osmAddr]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheaper
    ac[osmAddr.osmId] ||= [];
    ac[osmAddr.osmId].push(linzId);
    return ac;
  }, {});

  for (const osmId in byOsmId) {
    report += `${byOsmId[osmId].join(
      ' and ',
    )}\t\tare on the same node\t\t${toLink(osmId)}\n`;
  }

  await fs.writeFile(join(outFolder, 'corrupt.txt'), report);
}
