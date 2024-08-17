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
import { createDiamond, outFolder, toLink } from '../util/index.js';

export async function handleExistsButNoLinzRef(
  array: StatusReport[Status.EXISTS_BUT_NO_LINZ_REF],
): Promise<HandlerReturn> {
  const bySuburb = array.reduce(
    (ac, [linzId, [s, confidence, osmAddr]]) => {
      const [suburbType, suburb] = s;
      ac[suburb] ||= [];
      ac[suburb].push([linzId, suburbType, confidence, osmAddr]);
      return ac;
    },
    {} as Record<string, [string, string, Confidence, OsmAddr][]>,
  );

  let report = '';
  const index: HandlerReturn = {};

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;

    const features: GeoJsonFeature[] = [];

    for (const [linzId, suburbType, confidence, osmData] of bySuburb[suburb]) {
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
          // chances are if the ref is missing, so is the suburb/hamlet. so we may as well add it now.
          'addr:suburb': suburbType === 'U' ? suburb : undefined,
          'addr:hamlet': suburbType === 'R' ? suburb : undefined,
          // this logic also applies to other tags like building:flats, but for
          // performance reasons we don't pass those tags all the way through to this
          // function. TODO: also conflate building:flats, level, addr:city etc in
          // this function, to avoid editing the same node twice.
        },
      });
    }
    index[`Address Update - ${suburb}`] = features;
  }

  await fs.writeFile(join(outFolder, 'needs-linz-ref.txt'), report);

  return index;
}
