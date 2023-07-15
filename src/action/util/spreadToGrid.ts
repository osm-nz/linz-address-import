import type { Vec2 } from '../../extraLayers/linzTopo/geoOperations/vector';
import { GeoJsonFeature, HandlerReturnWithBBox } from '../../types';

const { sin, cos, floor, sqrt, PI: π } = Math;

/**
 * Determines the coordinate where we should place the n-th address, relative
 * to the original location which is (0,0)
 *
 * See https://desmos.com/calculator/nunxdg7x9b
 */
export function toFormation(n: number): Vec2 {
  const r = floor(sqrt(n));
  const θ = ((n - r ** 2) * π) / (2 * ((r + 1) ** 2 - r ** 2 - 1)) || 0;

  const [x, y] = [r * cos(θ), r * sin(θ)];
  return [+x.toFixed(2), +y.toFixed(2)];
}

/**
 * If there are multiple addresses in the same location,
 * we convert them into a stack if there are more than STACK_THRESHOLD.
 * If there are less, we spread them out in a grid formation around the
 * original point.
 */
export function shiftOverlappingPoints(
  sectors: HandlerReturnWithBBox,
): HandlerReturnWithBBox {
  for (const sectorName in sectors) {
    if (!sectorName.startsWith('Address Update - ')) continue;

    const sector = sectors[sectorName];
    const nodeByCoord: Record<string, GeoJsonFeature[]> = {};
    for (const feature of sector.features) {
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        // round to nearest 0.05seconds of latitude/longitude in case the points are slightly off
        // same logic as in stackLinzData.ts
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

        nodeByCoord[key] ||= [];
        nodeByCoord[key].push(feature);
      }
    }
    for (const nodes of Object.values(nodeByCoord)) {
      if (nodes.length > 1) {
        // multiple features in the same place, so offset the coordinates
        for (let index = 0; index < nodes.length; index += 1) {
          const [offsetX, offsetY] = toFormation(index);
          const [lng, lat] = nodes[index].geometry.coordinates as Vec2;
          nodes[index].geometry = {
            type: 'Point',
            coordinates: [lng + 0.000004 * offsetX, lat + 0.000004 * offsetY],
          };
        }
      }
    }
  }
  return sectors;
}
