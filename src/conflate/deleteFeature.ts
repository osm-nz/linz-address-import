import type { CallbackFunctions } from '../types.js';
import { LAYER_PREFIX } from './helpers/const.js';
import {
  deleteAllAddressTags,
  isNonTrivial,
} from './helpers/linzAddrToTags.js';

export const deleteFeature: CallbackFunctions['deleteFeature'] = ({ osm }) => {
  const suburb =
    osm.tags['addr:suburb'] ||
    osm.tags['addr:hamlet'] ||
    'deletions from unknown sector';
  const town = osm.tags['addr:city'];

  let group = suburb;
  if (town) group += `, ${town}`;

  if (osm.id[0] !== 'n' || isNonTrivial(osm.tags)) {
    // delete tags
    return {
      group,
      category: LAYER_PREFIX,
      diff: { tags: deleteAllAddressTags(osm.tags) },
    };
  }

  // in this case, it's just a standalone address node
  return {
    group,
    category: LAYER_PREFIX,
    diff: { tags: { __action: 'delete' } },
  };
};
