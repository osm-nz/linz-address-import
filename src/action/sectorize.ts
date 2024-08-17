import { chunk, getFirstCoord, getSector } from '../common/index.js';
import type {
  ExtraLayers,
  GeoJsonFeature,
  HandlerReturnWithBBox,
} from '../types.js';
import { calcBBox } from './util/index.js';
import {
  normalizeName,
  splitUntilSmallEnough,
} from './util/splitUntilSmallEnough.js';

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
    const { size, features, instructions, changesetTags } =
      originalFeatures[suburb];

    if (!suburb.includes('Address Update - ')) {
      // not antarctic and not an address suburb, so split this by region
      const out: Record<string, GeoJsonFeature[]> = {};
      for (const f of features) {
        const [lng, lat] = getFirstCoord(f.geometry);
        const sector = getSector({ lat, lng }, size);
        out[sector] ||= [];
        out[sector].push(f);
      }
      for (const sector in out) {
        const newSectors = splitUntilSmallEnough(
          `${suburb} - ${sector}`,
          instructions,
          changesetTags,
          out[sector],
        );
        Object.assign(newFeatures, newSectors);
      }
    } else if (suburb.includes('Antarctic')) {
      // NOTE: this only applies to legacy Antarctic datasets,
      // nowadays we use the same logic for all non-address layers.
      const chunked = chunk(features, 100);
      for (let index = 0; index < chunked.length; index += 1) {
        newFeatures[`${suburb} ${index + 1}`] = {
          features: chunked[index],
          bbox: calcBBox(chunked[index]),
          instructions,
        };
      }
    } else {
      // address dataset
      const newSectors = splitUntilSmallEnough(
        suburb,
        instructions,
        changesetTags,
        features,
      );
      Object.assign(newFeatures, newSectors);
    }
  }

  return normalizeName(newFeatures);
}
