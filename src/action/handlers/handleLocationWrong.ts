import { promises as fs } from 'fs';
import { join } from 'path';
import { Status, StatusReport, GeoJson, Index } from '../../types';
import {
  ExtentRecorder,
  mock,
  outFolder,
  suburbsFolder,
  toLink,
} from '../util';

export async function handleLocationWrong(
  arr: StatusReport[Status.EXISTS_BUT_LOCATION_WRONG],
): Promise<Index[]> {
  const geojson: GeoJson = {
    type: 'FeatureCollection',
    crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    features: [],
  };
  const extent = new ExtentRecorder();
  let report = '';

  for (const [linzId, d] of arr) {
    const [metres, osmId, lat, lng, wrongLat, wrongLng] = d;
    report += `${linzId}\t\t${toLink(
      osmId,
    )}\t\tneeds to move ${metres}m to ${lat},${lng}\n`;

    extent.visit({ lat, lng });
    extent.visit({ lat: wrongLat, lng: wrongLng });
    geojson.features.push({
      type: 'Feature',
      id: linzId,
      geometry: {
        type: 'LineString',
        coordinates: [
          [wrongLng, wrongLat],
          [lng, lat],
        ],
      },
      properties: {
        ref_linz_address: `LOCATION_WRONG_SPECIAL_${linzId}`,
      },
    });
  }

  await fs.writeFile(join(outFolder, 'location-wrong.txt'), report);
  await fs.writeFile(
    join(suburbsFolder, 'ZZ-Special-Location-Wrong.geo.json'),
    JSON.stringify(geojson, null, mock ? 2 : undefined),
  );

  if (!arr.length) return [];

  return [
    {
      suburb: 'ZZ Special Location Wrong',
      bbox: extent.bbox,
      count: arr.length,
      action: 'move',
    },
  ];
}
