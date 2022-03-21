import { chunk, getFirstCoord, getSector } from '../common';
import { ExtraLayers, GeoJsonFeature, HandlerReturnWithBBox } from '../types';
import { calcBBox } from './util';
import {
  normalizeName,
  splitUntilSmallEnough,
} from './util/splitUntilSmallEnough';

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

    if (!suburb.includes('Address Update - ')) {
      // not antarctic and not an address suburb, so split this by region
      const out: Record<string, GeoJsonFeature[]> = {};
      for (let i = 0; i < features.length; i += 1) {
        const f = features[i];
        const [lng, lat] = getFirstCoord(f.geometry);
        const sector = getSector({ lat, lng }, size, i);
        out[sector] ||= [];
        out[sector].push(f);
      }
      for (const sector in out) {
        const thisSector = splitUntilSmallEnough(
          `${suburb} - ${sector}`,
          instructions,
          out[sector],
        );
        Object.assign(newFeatures, thisSector);
      }
    } else if (suburb.includes('Antarctic')) {
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
      newFeatures[suburb] = {
        features,
        bbox: calcBBox(features),
        instructions,
      };
    }
  }

  return normalizeName(newFeatures);
}
