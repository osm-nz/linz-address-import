import { promises as fs } from 'fs';
import { join } from 'path';
import {
  GeoJsonFeature,
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import { createSquare, outFolder, toLink } from '../util';

export async function handleDuplicateLinzRef(
  arr: StatusReport[Status.MULTIPLE_EXIST],
): Promise<HandlerReturn> {
  const bySuburb = arr.reduce((ac, [linzId, [suburb, osmAddrList]]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, osmAddrList]);
    return ac;
  }, {} as Record<string, [linzId: string, osmAddrList: OsmAddr[]][]>);

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, osmIdList] of bySuburb[suburb]) {
      report += `${linzId}\t\texists on ${osmIdList
        .map((addr) => toLink(addr.osmId))
        .join(' and ')}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'duplicate-linz-ref.txt'), report);

  const features: GeoJsonFeature[] = [];

  for (const [, [, osmAddrList]] of arr) {
    const simpleNodes = osmAddrList.filter(
      (x) => x.osmId[0] === 'n' && !x.isNonTrivial,
    );
    const buildings = osmAddrList.filter((x) => x.osmId[0] !== 'n');

    // we can autofix this if there are only 2 addresses, where one is a simple node and one is a building
    // Then it's pretty much the same as diagnostic 15 (REPLACED_BY_BUILDING).
    // More complex situations need to be manually fixed.
    const isSimpleCase =
      osmAddrList.length === 2 &&
      simpleNodes.length === 1 &&
      buildings.length === 1;

    if (isSimpleCase) {
      // delete the simpleNode. Don't need to edit the building
      const toDelete = simpleNodes[0];

      features.push({
        type: 'Feature',
        id: toDelete.osmId,
        geometry: {
          type: 'Polygon',
          coordinates: createSquare(toDelete),
        },
        properties: { __action: 'delete' },
      });
    }
  }

  if (!features.length) return {};

  return { 'Merge duplicate addresses': features };
}
