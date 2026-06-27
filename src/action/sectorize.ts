import { getFirstCoord, getSector } from '../common/index.js';
import type {
  ExtraLayers,
  GeoJsonFeature,
  HandlerReturnWithBBox,
} from '../types.js';
import { LAYER_PREFIX } from './util/index.js';
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
    const { features, instructions, changesetTags } = originalFeatures[suburb];

    // eslint-disable-next-line unicorn/no-negated-condition -- to avoid destroying the git blame
    if (!suburb.includes(LAYER_PREFIX)) {
      // not antarctic and not an address suburb, so split this by region
      const out: Record<string, GeoJsonFeature[]> = {};
      for (const f of features) {
        const [lng, lat] = getFirstCoord(f.geometry);
        const sector = getSector({ lat, lng });
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
