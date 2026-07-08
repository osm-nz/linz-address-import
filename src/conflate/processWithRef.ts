import { readFileSync } from 'node:fs';
import { geoSphericalDistance } from '@id-sdk/geo';
import {
  type OsmFeature,
  OsmFlags,
  type SingleFeatureConflationResult,
  type TagDiff,
} from '@osm-conflation-engine/cli';
import type { Geometry } from 'geojson';
import { type LinzSourceFeature, type Overlapping, Status } from '../types.js';
import { getCoordKey } from '../common/geo.js';
import { overlappingFile } from '../preprocess/const.js';
import { REF_TAG } from '../config.js';
import { LAYER_PREFIX, toLink } from './helpers/const.js';
import { isNonTrivial } from './helpers/linzAddrToTags.js';
import { SPECIAL_REVIEW } from './postprocessLayer.js';
import { normaliseStreet } from './helpers/normaliseStreet.js';
import { compareWithMacrons } from './helpers/diacritics.js';
import { addToReport } from './report.js';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = { MAJOR: 300, MINOR: 10 };

let overlapping: Overlapping;

/**
 * @param skipStatusReport only exists when called by us. this is not supplied from the engine
 */
export const mergeOneToOne = (
  {
    osm: osmAddr,
    source: { properties: linzAddr },
  }: {
    source: LinzSourceFeature;
    osm: OsmFeature;
  },
  skipStatusReport?: boolean,
): SingleFeatureConflationResult => {
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

  if (isLocationOff) {
    tagDiff.__action = 'move';
    geometryDiff = {
      type: 'LineString',
      coordinates: [
        osmAddr.centroid, // old
        [linzAddr.lng, linzAddr.lat], // new
      ],
    };
  }

  const group = needsSpecialReview
    ? SPECIAL_REVIEW
    : (isMinorMove ? 'Slighly shift addresses - ' : LAYER_PREFIX) +
      linzAddr.suburb;

  // update the corresponding status report
  const didRefChange =
    osmAddr.tags[REF_TAG] && osmAddr.tags[REF_TAG] !== linzAddr.id;

  if (skipStatusReport === true) {
    // skip
  } else if (!osmAddr.tags[REF_TAG]) {
    // has no ref at the moment
    const code = tagDiff['addr:suburb'] ? 2 : 4;
    addToReport(
      Status.EXISTS_BUT_NO_LINZ_REF,
      linzAddr.suburb,
      `${REF_TAG}=${linzAddr.id}\t\t(${code})needs to be added to\t\t${toLink(
        osmAddr.id,
      )}`,
    );
  } else if (didRefChange) {
    addToReport(
      Status.LINZ_REF_CHANGED,
      linzAddr.suburb,
      `${osmAddr.tags[REF_TAG]}\t->\t${linzAddr.id}\t\t${toLink(osmAddr.id)}`,
    );
  } else if (tagDiff.__action === 'move') {
    addToReport(
      Status.EXISTS_BUT_LOCATION_WRONG,
      linzAddr.suburb,
      `${linzAddr.id}\t\t${toLink(
        osmAddr.id,
      )}\t\tneeds to move ${Math.round(offset)}m to ${linzAddr.lat},${linzAddr.lng}${isMinorMove ? ' *' : ''}`,
    );
  } else {
    if (Object.keys(tagDiff).some((key) => key !== '__action')) {
      // edit

      // ---- BEGIN LEGACY MADNESS ----
      // to make the snapshot tests pass, we convert the osm keys into
      // the whacky legacy format
      const isDoubleSuburb =
        (osmAddr.tags['addr:suburb'] || tagDiff['addr:suburb']) &&
        (osmAddr.tags['addr:hamlet'] || tagDiff['addr:hamlet']);

      const issues = Object.entries(tagDiff).map(([key, _after]) => {
        if (key === '__action') return '';
        const after = <string>_after;
        const before = osmAddr.tags[key];
        switch (key) {
          case 'addr:housenumber':
          case 'addr:street': {
            return `${key.replace('addr:', '')}|${after}|${before}`;
          }
          case 'addr:city': {
            return `town|${after}|${before}`;
          }
          case 'addr:suburb':
          case 'addr:hamlet': {
            if (isDoubleSuburb && after === '🗑️') return '';
            return `suburb|${after}|${osmAddr.tags['addr:suburb'] || osmAddr.tags['addr:hamlet'] || ''}`;
          }
          case 'building:flats': {
            return `flatCount|${after.replace('🗑️', '0')}|${before || 0}`;
          }
          case 'addr:type': {
            return `water|${+(after === 'water')}|${+(before === 'water')}`;
          }
          default: {
            return `${key}|${after}|${before}`;
          }
        }
      });
      if (isDoubleSuburb) issues.push('doubleSuburb||');
      // ---- END LEGACY MADNESS ----
      addToReport(
        Status.EXISTS_BUT_WRONG_DATA,
        group.replace(LAYER_PREFIX, ''),
        `${linzAddr.id}\t\t${toLink(osmAddr.id)}\t\t${issues.filter(Boolean).join('\tand\t')}`,
      );
    } else {
      // perfect :)
    }
  }

  return {
    group,
    diff: { tags: tagDiff, geometry: geometryDiff },
  };
};
