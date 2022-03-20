import { promises as fs } from 'fs';
import { join } from 'path';
import {
  GeoJsonFeature,
  HandlerReturn,
  LinzAddr,
  OsmAddr,
  Status,
  StatusReport,
} from '../../types';
import {
  createDiamond,
  createSquare,
  deleteAllAddressTags,
  linzAddrToTags,
  outFolder,
  toLink,
} from '../util';

type ByOsmId = {
  [osmId: string]: {
    osm: OsmAddr;
    linz: [linzId: string, linzAddr: LinzAddr][];
  };
};

export async function handleCorrupted(
  arr: StatusReport[Status.CORRUPT],
): Promise<HandlerReturn> {
  let report = '';
  const byOsmId = arr.reduce<ByOsmId>((ac, [linzId, [osmAddr, linzAddr]]) => {
    // eslint-disable-next-line no-param-reassign -- mutation is cheaper
    ac[osmAddr.osmId] ||= { osm: osmAddr, linz: [] };
    ac[osmAddr.osmId].linz.push([linzId, linzAddr]);
    return ac;
  }, {});

  for (const osmId in byOsmId) {
    report += `${byOsmId[osmId].linz
      .map((x) => x[0])
      .join(' and ')}\t\tare on the same node\t\t${toLink(osmId)}\n`;
  }

  await fs.writeFile(join(outFolder, 'corrupt.txt'), report);

  const features: GeoJsonFeature[] = [];

  for (const osmId in byOsmId) {
    const osmAddr = byOsmId[osmId].osm;

    // 1️⃣ delete or edit the corrupted feature
    if (osmId[0] === 'n' && !osmAddr.isNonTrivial) {
      // 1️⃣🅰️ it's an insignificant node, so we delete it
      features.push({
        type: 'Feature',
        id: osmAddr.osmId,
        geometry: {
          type: 'Polygon',
          coordinates: createSquare(osmAddr),
        },
        properties: { __action: 'delete' },
      });
    } else {
      // 1️⃣🅱️ it's a building or a buisness, so we edit it to remove the address tags
      features.push({
        type: 'Feature',
        id: osmAddr.osmId,
        geometry: {
          type: 'Polygon',
          coordinates: createDiamond(osmAddr),
        },
        properties: {
          __action: 'edit',
          ...deleteAllAddressTags(),
        },
      });
    }

    // 2️⃣ create replacement nodes for the ones that were merged together
    for (const [linzId, linzAddr] of byOsmId[osmId].linz) {
      features.push({
        type: 'Feature',
        id: linzId,
        geometry: {
          type: 'Point',
          coordinates: [linzAddr.lng, linzAddr.lat],
        },
        properties: linzAddrToTags(linzId, linzAddr),
      });
    }
  }

  if (!features.length) return {};

  return { 'Address Update': features };
}
