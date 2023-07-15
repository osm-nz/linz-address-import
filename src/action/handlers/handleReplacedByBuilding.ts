import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  GeoJsonFeature,
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import { createDiamond, createSquare, outFolder, toLink } from '../util';

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
      [linzId: string, osmNode: OsmAddr, osmBuilding: OsmAddr][]
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

  for (const [linzId, [osmNode, osmBuilding, suburb]] of array) {
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
    const suburbType = osmNode.suburb?.[0];

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

        // we can assume the conflation service would never have found this if the
        // housenumber or street was wrong. So the only tag we bother to add is suburb.
        ...(suburbType &&
          (suburbType === 'U'
            ? { 'addr:suburb': suburb }
            : { 'addr:hamlet': suburb })),
      },
    });
  }

  if (!features.length) return {};

  return { 'Merge address nodes and buildings': features };
}
