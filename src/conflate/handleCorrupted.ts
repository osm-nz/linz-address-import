import type {
  ConflationResultExtra,
  TagDiff,
} from '@osm-conflation-engine/cli';
import { type CallbackFunctions, Status } from '../types.js';
import { LAYER_PREFIX, toLink } from './helpers/const.js';
import {
  deleteAllAddressTags,
  isNonTrivial,
  linzAddrToTags,
} from './helpers/linzAddrToTags.js';
import { addToReport } from './report.js';

export const handleCorrupted: CallbackFunctions['mergeManyToOne'] & {} = ({
  osm: osmAddr,
  source: linzAddrs,
}) => {
  // pick the suburb from the first node
  const group = `${LAYER_PREFIX}${linzAddrs[0].properties.suburb}, ${linzAddrs[0].properties.town}`;
  let tagDiff: TagDiff;
  const extra: ConflationResultExtra = {};

  addToReport(
    Status.CORRUPT,
    linzAddrs[0].properties.suburb,
    `${linzAddrs
      .map((linzAddr) => linzAddr.properties.id)
      .join(' and ')}\t\tare on the same node\t\t${toLink(osmAddr.id)}`,
  );

  // 1️⃣ delete or edit the corrupted feature
  // eslint-disable-next-line unicorn/prefer-ternary -- more readable like this
  if (osmAddr.id[0] === 'n' && !isNonTrivial(osmAddr.tags)) {
    // 1️⃣🅰️ it's an insignificant node, so we delete it
    tagDiff = { __action: 'delete' };
  } else {
    // 1️⃣🅱️ it's a building or a buisness, so we edit it to remove the address tags
    tagDiff = deleteAllAddressTags(osmAddr.tags);
  }

  // 2️⃣ create replacement nodes for the ones that were merged together
  for (const { properties: linzAddr } of linzAddrs) {
    extra.createFeatures ||= [];
    extra.createFeatures.push({
      type: 'Feature',
      id: linzAddr.id,
      geometry: {
        type: 'Point',
        coordinates: [linzAddr.lng, linzAddr.lat],
      },
      properties: linzAddrToTags(linzAddr),
    });
  }

  return {
    group,
    diff: { tags: tagDiff },
    extra,
  };
};
