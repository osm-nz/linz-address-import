import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  AddressId,
  GeoJsonFeature,
  HandlerReturn,
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

export async function handleReplacedByBuilding(
  array: StatusReport[Status.REPLACED_BY_BUILDING],
): Promise<HandlerReturn> {
  const bySuburb = array.reduce(
    (ac, [linzId, [osmNode, osmBuilding, suburb]]) => {
      ac[suburb] ||= [];
      ac[suburb].push([linzId, osmNode, osmBuilding]);
      return ac;
    },
    {} as Record<
      string,
      [linzId: AddressId, osmNode: OsmAddr, osmBuilding: OsmAddr][]
    >,
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, osmNode, osmBuilding] of bySuburb[suburb]) {
      report += `${linzId}\t\t${toLink(
        osmNode.osmId,
      )}\t\tshould be merged into\t\t${toLink(osmBuilding.osmId)}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'replaced-by-building.txt'), report);

  const features: GeoJsonFeature[] = [];

  for (const [linzId, [osmNode, osmBuilding]] of array) {
    // two step process - delete the node, and edit the building to add the missing tags
    features.push({
      type: 'Feature',
      id: osmNode.osmId,
      geometry: {
        type: 'Polygon',
        coordinates: createSquare(osmNode),
      },
      properties: { __action: 'delete' },
    });

    // eslint-disable-next-line unicorn/no-array-push-push -- to avoid destroying the git blame
    features.push({
      type: 'Feature',
      id: osmBuilding.osmId,
      geometry: {
        type: 'Polygon',
        coordinates: createDiamond(osmBuilding),
      },
      properties: {
        __action: 'edit',
        'ref:linz:address_id': linzId,
      },
    });
  }

  if (!features.length) return {};

  return { 'Merge address nodes and buildings': features };
}
