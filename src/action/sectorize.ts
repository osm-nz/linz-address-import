import { chunk, getFirstCoord, getSector } from '../common';
import { ExtraLayers, GeoJsonFeature, HandlerReturnWithBBox } from '../types';
import { calcBBox } from './util';

const LAT_THRESHOLD = 1; // in degress of latitude
const LNG_THRESHOLD = 1; // in degress of longitude

/**
 * Some rural hamlets exist in two places in NZ, so the bbox is huge.
 *
 * Also, for deletions, we don't know which city it belongs to so the
 * changeset will be huge for duplicate suburbs.
 *
 * If that happens, this function will split huge changesets into sectors
 * (unless its a ZZ special suburb)
 */
export function sectorize(
  originalFeatures: ExtraLayers,
): HandlerReturnWithBBox {
  const newFeatures: HandlerReturnWithBBox = {};
  for (const suburb in originalFeatures) {
    const { size, features, instructions } = originalFeatures[suburb];
    const bbox = calcBBox(features);

    // very geographic names...
    const isTall = bbox.maxLat - bbox.minLat > LAT_THRESHOLD;
    const isWide = bbox.maxLng - bbox.minLng > LNG_THRESHOLD;

    if (
      suburb.startsWith('ZZ ') ||
      suburb.startsWith('Z ') ||
      suburb === 'Address Update' ||
      suburb === 'Merge address nodes and buildings'
    ) {
      // special sector, split this by region
      const out: Record<string, GeoJsonFeature[]> = {};
      for (let i = 0; i < features.length; i += 1) {
        const f = features[i];
        const [lng, lat] = getFirstCoord(f.geometry);
        const sector = getSector({ lat, lng }, size, i);
        out[sector] ||= [];
        out[sector].push(f);
      }
      for (const sector in out) {
        newFeatures[`${suburb} - ${sector}`] = {
          features: out[sector],
          bbox: calcBBox(out[sector]),
          instructions,
        };
      }
    } else if (isTall) {
      // big latitude wise
      const midway = bbox.minLat + (bbox.maxLat - bbox.minLat) / 2;
      const out: [north: GeoJsonFeature[], south: GeoJsonFeature[]] = [[], []];
      for (const f of features) {
        out[+(getFirstCoord(f.geometry)[1] < midway)].push(f);
      }

      newFeatures[`${suburb} - northern sector`] = {
        features: out[0],
        bbox: calcBBox(out[0]),
        instructions,
      };
      newFeatures[`${suburb} - southern sector`] = {
        features: out[1],
        bbox: calcBBox(out[1]),
        instructions,
      };
    } else if (isWide) {
      // big longitude wise
      const midway = bbox.minLng + (bbox.maxLng - bbox.minLng) / 2;
      const out: [east: GeoJsonFeature[], west: GeoJsonFeature[]] = [[], []];
      for (const f of features) {
        out[+(getFirstCoord(f.geometry)[0] < midway)].push(f);
      }

      newFeatures[`${suburb} - eastern sector`] = {
        features: out[0],
        bbox: calcBBox(out[0]),
        instructions,
      };
      newFeatures[`${suburb} - western sector`] = {
        features: out[1],
        bbox: calcBBox(out[1]),
        instructions,
      };
    } else if (suburb.includes('Antarctic')) {
      // split so that there are max 100 items per dataset
      const chunked = chunk(features, 100);
      for (let i = 0; i < chunked.length; i += 1) {
        newFeatures[`${suburb} ${i + 1}`] = {
          features: chunked[i],
          bbox: calcBBox(chunked[i]),
          instructions,
        };
      }
    } else {
      // not big
      newFeatures[suburb] = { features, bbox, instructions };
    }
  }
  return newFeatures;
}
