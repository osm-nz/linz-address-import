import { promises as fs } from 'fs';
import { join } from 'path';
import {
  GeoJsonFeature,
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import {
  createDiamond,
  deleteAllAddressTags,
  outFolder,
  toLink,
} from '../util';

export async function handleDeletedOnBuilding(
  arr: StatusReport[Status.NEEDS_DELETE_ON_BUILDING],
): Promise<HandlerReturn> {
  const bySuburb = arr.reduce((ac, [linzId, [suburb, osmAddr]]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, osmAddr]);
    return ac;
  }, {} as Record<string, [string, OsmAddr][]>);

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [linzId, osmAddr] of bySuburb[suburb]) {
      report += `${linzId}\t\tneeds deleting but is on a building\t\t${toLink(
        osmAddr.osmId,
      )}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'needs-delete-on-building.txt'), report);

  const features: GeoJsonFeature[] = [];

  for (const [, [, osmAddr]] of arr) {
    features.push({
      type: 'Feature',
      id: osmAddr.osmId,
      geometry: {
        type: 'Polygon',
        coordinates: createDiamond(osmAddr),
      },
      properties: {
        __action: 'edit',
        ...deleteAllAddressTags(),
      },
    });
  }

  if (!features.length) return {};

  return { 'Address Update': features };
}
