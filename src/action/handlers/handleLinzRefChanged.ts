import { promises as fs } from 'fs';
import { join } from 'path';
import {
  GeoJsonFeature,
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import { createDiamond, outFolder, toLink } from '../util';

export async function handleLinzRefChanged(
  arr: StatusReport[Status.LINZ_REF_CHANGED],
): Promise<HandlerReturn> {
  const bySuburb = arr.reduce(
    (ac, [oldLinzId, [suburb, newLinzId, osmAddr]]) => {
      // eslint-disable-next-line no-param-reassign -- mutation is cheap
      ac[suburb] ||= [];
      ac[suburb].push([oldLinzId, newLinzId, osmAddr]);
      return ac;
    },
    {} as Record<string, [string, string, OsmAddr][]>,
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [oldLinzId, newLinzId, osmAddr] of bySuburb[suburb]) {
      report += `${oldLinzId}\t->\t${newLinzId}\t\t${toLink(osmAddr.osmId)}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'linz-ref-changed.txt'), report);

  const features: GeoJsonFeature[] = [];

  for (const [, [, newLinzId, osmData, linzData]] of arr) {
    features.push({
      type: 'Feature',
      id: osmData.osmId,
      geometry: {
        type: 'Polygon',
        coordinates: createDiamond(osmData),
      },
      properties: {
        __action: 'edit',
        'ref:linz:address_id': newLinzId,
        // if an address gets subdivided, add the building:flats tag at the same
        // time as the ID changes into a stack
        'building:flats': linzData.flatCount?.toString(),
      },
    });
  }

  if (!features.length) return {};

  return { 'Address Update - Special Linz Ref Changed': features };
}
