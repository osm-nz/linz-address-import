import type {
  OsmFeature,
  SingleFeatureConflationResult,
  TagDiff,
} from '@osm-conflation-engine/cli';
import type { LinzAddr, LinzSourceFeature } from '../types.js';
import { REF_TAG } from '../config.js';
import { mergeOneToOne } from './processWithRef.js';

function checkIfMatching(
  prefix: string,
  osmAddr: OsmFeature,
  linzAddr: LinzAddr | undefined,
  mainLinzAddr: LinzAddr,
): TagDiff {
  const tagDiff: TagDiff = {};
  if (!linzAddr) return tagDiff; // no issue

  if (osmAddr.tags[`${prefix}:housenumber`] !== linzAddr.housenumber) {
    tagDiff[`${prefix}:housenumber`] = linzAddr.housenumber;
  }

  const isStreetSame = linzAddr.street === mainLinzAddr.street;
  if (isStreetSame) {
    if (osmAddr.tags[`${prefix}:street`]) {
      tagDiff[`${prefix}:street`] = '🗑️';
    }
  } else {
    // streets are different, so the tag should exist
    if (osmAddr.tags[`${prefix}:street`] !== linzAddr.street) {
      tagDiff[`${prefix}:street`] = linzAddr.street;
    }
  }

  return tagDiff;
}

/**
 * This function is called for every feature with a linz ref that contains a semicolon.
 * These could either be valid stacks, or they could be corrupted.
 * If corrupted, we'll return undefined, to defer to {@link handleCorrupted}.
 */
export function checkStackedAddr(
  osmAddr: OsmFeature,
  linzAddrs: LinzSourceFeature[],
): SingleFeatureConflationResult | undefined {
  const osmRefs = new Set(osmAddr.tags[REF_TAG].split(';'));
  const linzRefs = new Set(linzAddrs.map((linzAddr) => linzAddr.properties.id));

  // abort if some of the refs in the OSM tag are invalid
  if (osmRefs.size !== linzRefs.size) return undefined;

  // abort if the refs don't match for some reason (this should be impossible?)
  if (osmRefs.symmetricDifference(linzRefs).size) return undefined;

  // abort if this is a merge gone wrong
  if (
    osmAddr.tags['addr:housenumber']?.includes(';') ||
    osmAddr.tags['addr:street']?.includes(';')
  ) {
    return undefined;
  }

  // run the normal conflation for the main address (index 0)
  const result: SingleFeatureConflationResult = mergeOneToOne(
    { osm: osmAddr, source: linzAddrs[0] },
    true,
  );
  delete result.diff.tags[REF_TAG];

  const maxAltTag = Object.keys(osmAddr.tags)
    .map((key) => +(key.match(/^addr(\d+):/)?.[1] || 0))
    .toSorted((a, b) => b - a)[0];

  // if alt_addr exists, then it should be index 1
  if (osmAddr.tags['alt_addr:housenumber']) {
    Object.assign(
      result.diff.tags,
      checkIfMatching(
        'alt_addr',
        osmAddr,
        linzAddrs[1].properties,
        linzAddrs[0].properties,
      ),
    );
  }

  // start at 2 because addr0:* and addr1:* are not valid.
  for (let i = 2; i <= maxAltTag; i++) {
    Object.assign(
      result.diff.tags,
      checkIfMatching(
        `addr${i}`,
        osmAddr,
        linzAddrs[i]?.properties,
        linzAddrs[0].properties,
      ),
    );
  }

  return result;
}
