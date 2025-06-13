import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  AddressId,
  GeoJsonFeature,
  HandlerReturn,
  LinzAddr,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types.js';
import {
  createDiamond,
  createSquare,
  outFolder,
  toLink,
} from '../util/index.js';

const toKey = (addr: LinzAddr | OsmAddr) =>
  `${addr.housenumber} ${addr.street}${addr.suburb?.[0]}${addr.suburb?.[1]}`;

export async function handleDuplicateLinzRef(
  array: StatusReport[Status.MULTIPLE_EXIST],
): Promise<HandlerReturn> {
  const autofixable: Record<string, '✅' | '⚠️'> = {};
  const features: GeoJsonFeature[] = [];

  for (const [linzId, [linzAddr, osmAddrList]] of array) {
    const simpleNodes = osmAddrList.filter(
      (x) => x.osmId[0] === 'n' && !x.isNonTrivial,
    );

    // we can autofix this if some of the duplicates are simple nodes

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
        autofixable[linzId] = '✅';
      }
    } else if (simpleNodes.length) {
      // Either (a) all nodes are simple. Arbitrarily pick 1 to keep and delete the rest.
      // Or     ( b) notall of the addresses are simple, so delete only the simple ones.
      const toDelete =
        simpleNodes.length === osmAddrList.length
          ? simpleNodes.slice(1)
          : simpleNodes;

      const notFullyFixed = osmAddrList.length - simpleNodes.length > 1;

      // delete the simple nodes
      for (const addr of toDelete) {
        features.push({
          type: 'Feature',
          id: addr.osmId,
          geometry: {
            type: 'Polygon',
            coordinates: createSquare(addr),
          },
          properties: { __action: 'delete' },
        });
      }
      autofixable[linzId] = notFullyFixed ? '⚠️' : '✅';
    }
  }

  const bySuburb = array.reduce(
    (ac, [linzId, [linzAddr, osmAddrList]]) => {
      const suburb = linzAddr.suburb[1];
      ac[suburb] ||= [];
      ac[suburb].push([linzId, linzAddr, osmAddrList]);
      return ac;
    },
    {} as Record<
      string,
      [linzId: AddressId, linzAddr: LinzAddr, osmAddrList: OsmAddr[]][]
    >,
  );

  let report = [
    '✅ = issue can be autofixed',
    '⚠️ = issue can be partially autofixed',
    '❌ = issue cannot be autofixed',
    '',
  ].join('\n');
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, , osmIdList] of bySuburb[suburb]) {
      report += `${linzId}\t${
        autofixable[linzId] || '❌'
      }\texists on ${osmIdList
        .map((addr) => toLink(addr.osmId))
        .join(' and ')}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'duplicate-linz-ref.txt'), report);

  if (!features.length) return {};

  return { 'Merge duplicate addresses': features };
}
