import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types.js';
import {
  LAYER_PREFIX,
  createDiamond,
  outFolder,
  toLink,
} from '../util/index.js';

export async function handleLinzRefChanged(
  array: StatusReport[Status.LINZ_REF_CHANGED],
): Promise<HandlerReturn> {
  const bySuburb = array.reduce<Record<string, [string, string, OsmAddr][]>>(
    (ac, [oldLinzId, [suburb, newLinzId, osmAddr]]) => {
      ac[suburb] ||= [];
      ac[suburb].push([oldLinzId, newLinzId, osmAddr]);
      return ac;
    },
    {},
  );

  let report = '';
  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;
    for (const [oldLinzId, newLinzId, osmAddr] of bySuburb[suburb]) {
      report += `${oldLinzId}\t->\t${newLinzId}\t\t${toLink(osmAddr.osmId)}\n`;
    }
  }

  await fs.writeFile(join(outFolder, 'linz-ref-changed.txt'), report);

  const features: HandlerReturn = {};

  for (const [, [suburb, newLinzId, osmData, linzData]] of array) {
    features[LAYER_PREFIX + suburb] ||= [];
    features[LAYER_PREFIX + suburb].push({
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

  return features;
}
