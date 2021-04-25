import { promises as fs } from 'fs';
import { join } from 'path';
import {
  Confidence,
  GeoJsonFeature,
  HandlerReturn,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import { createDiamond, outFolder, toLink } from '../util';

export async function handleExistsButNoLinzRef(
  arr: StatusReport[Status.EXISTS_BUT_NO_LINZ_REF],
): Promise<HandlerReturn> {
  const bySuburb = arr.reduce((ac, [linzId, [s, confidence, osmAddr]]) => {
    const [suburbType, suburb] = s;
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, suburbType, confidence, osmAddr]);
    return ac;
  }, {} as Record<string, [string, string, Confidence, OsmAddr][]>);

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
        id: `SPECIAL_EDIT_${linzId}`,
        geometry: {
          type: 'Polygon',
          coordinates: createDiamond(osmData),
        },
        properties: {
          ref_linz_address: `SPECIAL_EDIT_${linzId}`,
          new_linz_ref: linzId,
          // chances are if the ref is missing, so is the suburb/hamlet. so we may as well add it now.
          addr_suburb: suburbType === 'U' ? suburb : undefined,
          addr_hamlet: suburbType === 'R' ? suburb : undefined,
          osm_id: osmData.osmId, // special tag to instruct RapiD which node to add the tag to, since the node has no linz ref
        },
      });
    }
    index[`Address Update - ${suburb}`] = features;
  }

  await fs.writeFile(join(outFolder, 'needs-linz-ref.txt'), report);

  return index;
}
