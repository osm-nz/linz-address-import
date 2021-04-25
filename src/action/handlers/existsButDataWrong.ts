import { promises as fs } from 'fs';
import { join } from 'path';
import {
  Status,
  StatusReport,
  OsmAddr,
  Issue,
  HandlerReturn,
  GeoJsonFeature,
} from '../../types';
import { createDiamond, outFolder, toLink } from '../util';
import { fieldsToModify } from '../util/fieldsToModify';

export async function existsButDataWrong(
  arr: StatusReport[Status.EXISTS_BUT_WRONG_DATA],
): Promise<HandlerReturn> {
  const bySuburb = arr.reduce((ac, [linzId, [osmAddr, suburb, ...issues]]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, osmAddr, issues]);
    return ac;
  }, {} as Record<string, [string, OsmAddr, Issue[]][]>);

  let report = '';
  const index: HandlerReturn = {};

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;

    const features: GeoJsonFeature[] = [];

    for (const [linzId, osmData, issues] of bySuburb[suburb]) {
      // const [key, wrong, right] = issue.split('|');
      report += `${linzId}\t\t${toLink(osmData.osmId)}\t\t${issues.join(
        '\tand\t',
      )}\n`;

      features.push({
        type: 'Feature',
        id: `SPECIAL_EDIT_${linzId}`,
        geometry: {
          type: 'Polygon',
          coordinates: createDiamond(osmData),
        },
        properties: {
          ref_linz_address: `SPECIAL_EDIT_${linzId}`,
          ...fieldsToModify(issues),
        },
      });
    }

    index[`Address Update - ${suburb}`] = features;
  }

  await fs.writeFile(join(outFolder, 'data-wrong.txt'), report);

  return index;
}
