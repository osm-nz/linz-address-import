import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  GeoJsonFeature,
  HandlerReturn,
  Status,
  StatusReport,
} from '../../types.js';
import { createDiamond, outFolder, toLink } from '../util/index.js';

export async function handleMultipleExistButNoLinzRef(
  array: StatusReport[Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF],
): Promise<HandlerReturn> {
  let report = '';
  for (const [linzId, [, osmIds]] of array) {
    report += `ref:linz:address_id=${linzId}\t\tneeds to be added to\t\t${osmIds
      .map(toLink)
      .join(' or ')}\n`;
  }

  await fs.writeFile(
    join(outFolder, 'needs-linz-ref-but-multiple.txt'),
    report,
  );

  const features: GeoJsonFeature[] = [];

  for (const [linzId, [chosenOsmAddr]] of array) {
    features.push({
      type: 'Feature',
      id: chosenOsmAddr.osmId,
      geometry: {
        type: 'Polygon',
        coordinates: createDiamond(chosenOsmAddr),
      },
      properties: {
        __action: 'edit',
        'ref:linz:address_id': linzId,
      },
    });
  }

  if (!features.length) return {};

  return { 'Address Update': features };
}
