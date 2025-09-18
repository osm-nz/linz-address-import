import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  Confidence,
  GeoJsonFeature,
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

export async function handleExistsButNoLinzRef(
  array: StatusReport[Status.EXISTS_BUT_NO_LINZ_REF],
): Promise<HandlerReturn> {
  const bySuburb = array.reduce(
    (ac, [linzId, [suburb, confidence, osmAddr]]) => {
      ac[suburb] ||= [];
      ac[suburb].push([linzId, confidence, osmAddr]);
      return ac;
    },
    {} as Record<string, [string, Confidence, OsmAddr][]>,
  );

  let report = '';
  const index: HandlerReturn = {};

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;

    const features: GeoJsonFeature[] = [];

    for (const [linzId, confidence, osmData] of bySuburb[suburb]) {
      report += `ref:linz:address_id=${linzId}\t\t(${confidence})needs to be added to\t\t${toLink(
        osmData.osmId,
      )}\n`;

      features.push({
        type: 'Feature',
        id: osmData.osmId,
        geometry: {
          type: 'Polygon',
          coordinates: createDiamond(osmData),
        },
        properties: {
          __action: 'edit',
          'ref:linz:address_id': linzId,
          // chances are if the ref is missing, so is the suburb/hamlet.
          // this logic also applies to other tags like building:flats, but for
          // performance reasons we don't pass those tags all the way through to this
          // function. TODO: also conflate building:flats, level, addr:city etc in
          // this function, to avoid editing the same node twice.
        },
      });
    }
    index[LAYER_PREFIX + suburb] = features;
  }

  await fs.writeFile(join(outFolder, 'needs-linz-ref.txt'), report);

  return index;
}
