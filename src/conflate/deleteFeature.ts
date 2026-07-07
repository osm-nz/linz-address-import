import { LAYER_PREFIX, toLink } from '../action/util/const.js';
import {
  deleteAllAddressTags,
  isNonTrivial,
} from '../action/util/linzAddrToTags.js';
import { REF_TAG } from '../config.js';
import { type CallbackFunctions, Status } from '../types.js';
import { addToReport } from './report.js';

export const deleteFeature: CallbackFunctions['deleteFeature'] = ({ osm }) => {
  const suburb =
    osm.tags['addr:suburb'] ||
    osm.tags['addr:hamlet'] ||
    'deletions from unknown sector';

  const group = LAYER_PREFIX + suburb;

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
    diff: { tags: { __action: 'delete' } },
  };
};
