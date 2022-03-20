import { promises as fs } from 'fs';
import { join } from 'path';
import {
  GeoJsonFeature,
  HandlerReturn,
  Status,
  StatusReport,
} from '../../types';
import { createDiamond, outFolder, toLink } from '../util';

export async function handleMultipleExistButNoLinzRef(
  arr: StatusReport[Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF],
): Promise<HandlerReturn> {
  let report = '';
  for (const [linzId, [, osmIds]] of arr) {
    report += `ref:linz:address_id=${linzId}\t\tneeds to be added to\t\t${osmIds
      .map(toLink)
      .join(' or ')}\n`;
  }

  await fs.writeFile(
    join(outFolder, 'needs-linz-ref-but-multiple.txt'),
    report,
  );

  const features: GeoJsonFeature[] = [];

  for (const [linzId, [chosenOsmAddr]] of arr) {
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
