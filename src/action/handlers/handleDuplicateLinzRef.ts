import { promises as fs } from 'fs';
import { join } from 'path';
import {
  GeoJsonFeature,
  HandlerReturn,
  LinzAddr,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import { createDiamond, createSquare, outFolder, toLink } from '../util';

const toKey = (addr: LinzAddr | OsmAddr) =>
  `${addr.housenumber} ${addr.street}${addr.suburb?.[0]}${addr.suburb?.[1]}`;

export async function handleDuplicateLinzRef(
  arr: StatusReport[Status.MULTIPLE_EXIST],
): Promise<HandlerReturn> {
  const bySuburb = arr.reduce((ac, [linzId, [linzAddr, osmAddrList]]) => {
    const suburb = linzAddr.suburb[1];
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, linzAddr, osmAddrList]);
    return ac;
  }, {} as Record<string, [linzId: string, linzAddr: LinzAddr, osmAddrList: OsmAddr[]][]>);

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, , osmIdList] of bySuburb[suburb]) {
      report += `${linzId}\t\texists on ${osmIdList
        .map((addr) => toLink(addr.osmId))
        .join(' and ')}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'duplicate-linz-ref.txt'), report);

  const features: GeoJsonFeature[] = [];

  for (const [, [linzAddr, osmAddrList]] of arr) {
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

    // another case we can autofix is if one node has info that doesn't match the linz ref
    // e.g. No.12 and No.12A both have the linz ref for No.12
    const correctKey = toKey(linzAddr);
    const idDoesntMatchAddr = osmAddrList.filter(
      (osmAddr) => toKey(osmAddr) !== correctKey,
    );

    if (idDoesntMatchAddr.length) {
      for (const dodgyAddr of idDoesntMatchAddr) {
        // we won't delete it - if it's got mismatched data it's probably a correct address,
        // someone just copy-pasted the ref tag from another addr
        features.push({
          type: 'Feature',
          id: dodgyAddr.osmId,
          geometry: {
            type: 'Polygon',
            coordinates: createDiamond(dodgyAddr),
          },
          properties: { __action: 'edit', 'ref:linz:address_id': '🗑️' },
        });
      }
    } else if (isSimpleCase) {
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
