import { REF_TAG } from '../config.js';
import { type CallbackFunctions, Status } from '../types.js';
import { LAYER_PREFIX, toLink } from './helpers/const.js';
import {
  deleteAllAddressTags,
  isNonTrivial,
} from './helpers/linzAddrToTags.js';
import { addToReport } from './report.js';

export const deleteFeature: CallbackFunctions['deleteFeature'] = ({ osm }) => {
  const suburb =
    osm.tags['addr:suburb'] ||
    osm.tags['addr:hamlet'] ||
    'deletions from unknown sector';
  const town = osm.tags['addr:city'];

  let group = suburb;
  if (town) group += `, ${town}`;

  if (osm.id[0] !== 'n' || isNonTrivial(osm.tags)) {
    if (osm.id[0] !== 'n' || osm.tags.building) {
      addToReport(
        Status.NEEDS_DELETE_ON_BUILDING,
        suburb,
        `${osm.tags[REF_TAG]}\t\tneeds deleting but is on a building\t\t${toLink(osm.id)}`,
      );
    } else {
      addToReport(
        Status.NEEDS_DELETE_NON_TRIVIAL,
        suburb,
        `${osm.tags[REF_TAG]}\t\tneeds deleting but is on a POI\t\t${toLink(osm.id)}`,
      );
    }

    // delete tags
    return {
      group,
      category: LAYER_PREFIX,
      diff: { tags: deleteAllAddressTags(osm.tags) },
    };
  }

  // in this case, it's just a standalone address node
  addToReport(
    Status.NEEDS_DELETE,
    suburb,
    `${osm.tags[REF_TAG]}\t\tneeds deleting\t\t${toLink(osm.id)}`,
  );

  return {
    group,
    category: LAYER_PREFIX,
    diff: { tags: { __action: 'delete' } },
  };
};
