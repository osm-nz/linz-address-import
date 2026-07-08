import type { Tags } from 'osm-api';
import type { LinzAddr } from '../../types.js';
import { ADDR_KEY_REGEX, REF_TAG } from '../../config.js';

export function linzAddrToTags(addr: LinzAddr): Tags {
  const tags: Record<string, string | undefined> = {
    'addr:housenumber': addr.housenumber,
    'alt_addr:housenumber': addr.housenumberAlt,
    'addr:street': addr.street,
    'addr:suburb': addr.suburb,
    // we don't add `addr:city`
    'addr:type': addr.water ? 'water' : undefined,
    'building:flats': addr.flatCount?.toString(),
    [REF_TAG]: addr.id,
    'linz:stack': addr.isManualStackRequest ? 'yes' : undefined,
  };
  for (const k in tags) if (!tags[k]) delete tags[k];
  return <Tags>tags;
}

const otherTagsToDelete = new Set([
  'building:flats',
  'linz:stack',
  REF_TAG,
  'check_date',
]);

export function deleteAllAddressTags(tags: Tags): Tags {
  const diff: Tags = {};
  for (const k in tags) {
    if (ADDR_KEY_REGEX.test(k) || otherTagsToDelete.has(k)) {
      // skip
      diff[k] = '🗑️';
    }
  }
  return diff;
}

/**
 * @returns true if the feature has some non-imported tags which should
 * be retained when deleting the address.
 */
export function isNonTrivial(tags: Tags) {
  return Object.keys(tags).some(
    (key) => !ADDR_KEY_REGEX.test(key) && !otherTagsToDelete.has(key),
  );
}
