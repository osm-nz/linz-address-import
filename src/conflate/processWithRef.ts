import { readFileSync } from 'node:fs';
import { geoSphericalDistance } from '@id-sdk/geo';
import {
  type OsmFeature,
  OsmFlags,
  type SingleFeatureConflationResult,
  type TagDiff,
} from '@osm-conflation-engine/cli';
import type { Geometry } from 'geojson';
import type { LinzSourceFeature, Overlapping } from '../types.js';
import { getCoordKey } from '../common/geo.js';
import { overlappingFile } from '../preprocess/const.js';
import { REF_TAG } from '../config.js';
import { LAYER_PREFIX } from './helpers/const.js';
import { isNonTrivial } from './helpers/linzAddrToTags.js';
import { SPECIAL_REVIEW } from './postprocessLayer.js';
import { normaliseStreet } from './helpers/normaliseStreet.js';
import { compareWithMacrons } from './helpers/diacritics.js';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = { MAJOR: 300, MINOR: 10 };

let overlapping: Overlapping;

export const mergeOneToOne = ({
  osm: osmAddr,
  source: { properties: linzAddr },
}: {
  source: LinzSourceFeature;
  osm: OsmFeature;
}): SingleFeatureConflationResult => {
  overlapping ||= JSON.parse(readFileSync(overlappingFile, 'utf8'));
  const needsSpecialReview =
    osmAddr.flags & OsmFlags.IsRecentlyChanged &&
    !(osmAddr.flags & OsmFlags.IsLastEditedByImporter);

  const tagDiff: TagDiff = { __action: 'edit' };
  let geometryDiff: Geometry | undefined;

  // 0.
  if (linzAddr.id !== osmAddr.tags[REF_TAG]) {
    tagDiff[REF_TAG] = linzAddr.id;
  }

  // 1.
  const houseOk = linzAddr.housenumber === osmAddr.tags['addr:housenumber'];
  if (!houseOk) {
    tagDiff['addr:housenumber'] = linzAddr.housenumber;
  }

  // 2.
  const streetOk = compareWithMacrons(
    normaliseStreet(linzAddr.street),
    normaliseStreet(osmAddr.tags['addr:street'] || ''),
  );
  if (!streetOk) {
    tagDiff['addr:street'] = linzAddr.street;
  }

  // 3.
  const suburbOk =
    linzAddr.suburb ===
    (osmAddr.tags['addr:suburb'] || osmAddr.tags['addr:hamlet']);
  if (!suburbOk) {
    tagDiff['addr:suburb'] = linzAddr.suburb;
    if (osmAddr.tags['addr:hamlet']) {
      tagDiff['addr:hamlet'] = '🗑️';
    }
  }
  // 3b. duplicate suburb
  if (osmAddr.tags['addr:suburb'] && osmAddr.tags['addr:hamlet']) {
    tagDiff['addr:hamlet'] = '🗑️';
  }

  // 4.
  const townOk = // addr:city is only conflated if the tag already exists
    !osmAddr.tags['addr:city'] ||
    !linzAddr.town ||
    linzAddr.town === linzAddr.suburb || // don't add addr:city if it duplicates addr:suburb
    linzAddr.town === osmAddr.tags['addr:city'];

  // if the `suburb` is changing, also conflate `town`
  const townNeedsChangingBcSuburbChanged =
    !suburbOk && // if suburb is not okay,
    !!osmAddr.tags['addr:city'] && // and there is a town
    linzAddr.town !== linzAddr.suburb && // but don't add addr:city if it duplicates addr:suburb
    linzAddr.town !== osmAddr.tags['addr:city']; // and don't do anything if osm already has the correct value

  if (!townOk || townNeedsChangingBcSuburbChanged) {
    tagDiff['addr:city'] = linzAddr.town;
  }

  // 5.
  if (linzAddr.water && osmAddr.tags['addr:type'] !== 'water') {
    tagDiff['addr:type'] = 'water';
  }

  // 6.
  if (linzAddr.flatCount) {
    if (osmAddr.tags['building:flats'] !== linzAddr.flatCount?.toString()) {
      tagDiff['building:flats'] = linzAddr.flatCount.toString();
    }
  } else {
    if (osmAddr.tags['building:flats']) tagDiff['building:flats'] = '🗑️';
  }

  // 7.
  /** metres */
  const offset = geoSphericalDistance(
    [linzAddr.lng, linzAddr.lat],
    osmAddr.centroid,
  );

  // 8.
  // If a feature was moved by a mapper, that's great. But if it's never
  // been touched since the original import, then we should move it when
  // LINZ updates the location. Therefore, use a much lower threshold.
  const isVeryFarOff = offset > LOCATION_THRESHOLD.MAJOR;
  const isSlightlyOff =
    offset > LOCATION_THRESHOLD.MINOR &&
    !isNonTrivial(osmAddr.tags) && // skip nonTrivial addresses (e.g. a business)
    !overlapping[getCoordKey(linzAddr.lat, linzAddr.lng)] && // respect manually unstacked clumps
    osmAddr.id[0] === 'n' && // skip areas
    linzAddr.id[0] !== '3' && // skip addresses from CADs
    !linzAddr.flatCount; // skip stacked addresses

  const isLocationOff =
    osmAddr.flags & OsmFlags.IsLastEditedByImporter
      ? isSlightlyOff
      : isVeryFarOff;

  const isMinorMove =
    !!(osmAddr.flags & OsmFlags.IsLastEditedByImporter) &&
    isSlightlyOff &&
    !isVeryFarOff;

  if (isLocationOff && osmAddr.id[0] === 'n') {
    tagDiff.__action = 'move';
    geometryDiff = {
      type: 'LineString',
      coordinates: [
        osmAddr.centroid, // old
        [linzAddr.lng, linzAddr.lat], // new
      ],
    };
  }

  const category = needsSpecialReview
    ? SPECIAL_REVIEW
    : isMinorMove
      ? 'Slighly shift addresses'
      : LAYER_PREFIX;
  const group = `${linzAddr.suburb}, ${linzAddr.town}`;

  return {
    group,
    category,
    diff: { tags: tagDiff, geometry: geometryDiff },
  };
};
