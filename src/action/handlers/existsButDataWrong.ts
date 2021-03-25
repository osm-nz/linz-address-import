import { promises as fs } from 'fs';
import { join } from 'path';
import {
  Status,
  StatusReport,
  GeoJson,
  OsmAddr,
  Index,
  Issue,
} from '../../types';
import {
  createDiamond,
  ExtentRecorder,
  mock,
  outFolder,
  REGEX,
  suburbsFolder,
  toLink,
} from '../util';
import { fieldsToModify } from '../util/fieldsToModify';

export async function existsButDataWrong(
  arr: StatusReport[Status.EXISTS_BUT_WRONG_DATA],
): Promise<void> {
  const bySuburb = arr.reduce((ac, [linzId, [osmAddr, suburb, ...issues]]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheap
    ac[suburb] ||= [];
    ac[suburb].push([linzId, osmAddr, issues]);
    return ac;
  }, {} as Record<string, [string, OsmAddr, Issue[]][]>);

  let report = '';
  const index: Index[] = [];

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;

    const sector = `${suburb} (Edit)`;
    const extent = new ExtentRecorder();
    const geojson: GeoJson = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
      features: [],
    };

    for (const [linzId, osmData, issues] of bySuburb[suburb]) {
      // const [key, wrong, right] = issue.split('|');
      report += `${linzId}\t\t${toLink(osmData.osmId)}\t\t${issues.join(
        '\tand\t',
      )}\n`;

      extent.visit(osmData);
      geojson.features.push({
        type: 'Feature',
        id: `SPECIAL_EDIT_${linzId}`,
        geometry: {
          type: 'Polygon',
          coordinates: createDiamond(osmData),
        },
        properties: {
          ref_linz_address: `SPECIAL_EDIT_${linzId}`,
          ...fieldsToModify(issues),
        },
      });
    }

    index.push({
      suburb: sector,
      bbox: extent.bbox,
      count: bySuburb[suburb].length,
      action: 'edit',
    });
    await fs.writeFile(
      join(suburbsFolder, `${sector.replace(REGEX, '-')}.geo.json`),
      JSON.stringify(geojson, null, mock ? 2 : undefined),
    );
  }

  await fs.writeFile(join(outFolder, 'data-wrong.txt'), report);
}
