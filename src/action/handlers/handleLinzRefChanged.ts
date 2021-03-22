import { promises as fs } from 'fs';
import { join } from 'path';
import { GeoJson, Index, OsmAddr, Status, StatusReport } from '../../types';
import { createDiamond, mock, outFolder, toLink } from '../util';

export async function handleLinzRefChanged(
  arr: StatusReport[Status.LINZ_REF_CHANGED],
): Promise<Index[]> {
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

  const geojson: GeoJson = {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    features: [],
  };
  for (const [oldLinzId, [, newLinzId, osmData]] of arr) {
    geojson.features.push({
      type: 'Feature',
      id: `SPECIAL_EDIT_${oldLinzId}`,
      geometry: {
        type: 'Polygon',
        coordinates: createDiamond(osmData),
      },
      properties: {
        ref_linz_address: `SPECIAL_EDIT_${oldLinzId}`,
        new_linz_ref: newLinzId,
      },
    });
  }
  await fs.writeFile(
    join(outFolder, 'suburbs', 'ZZ-Special-Linz-Ref-Changed.geo.json'),
    JSON.stringify(geojson, null, mock ? 2 : undefined),
  );

  return [
    {
      suburb: 'ZZ Special Linz Ref Changed',
      // temporary, lazy assumption to cover the whole mainland + chathams + stewart is.
      bbox: {
        minLat: -48.026701,
        maxLat: -32.932388,
        minLng: 165.019045,
        maxLng: 184.227542,
      },
      count: 'N/A',
      action: 'edit ref',
    },
  ];
}
