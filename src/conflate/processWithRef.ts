import { geoSphericalDistance } from '@id-sdk/geo';
import {
  type AddressId,
  CheckDate,
  type Issue,
  type LinzAddr,
  type OsmAddr,
  type Overlapping,
  Status,
} from '../types.js';
import { getCoordKey } from '../common/geo.js';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses.js';
import { validate } from './helpers/validate.js';
import { normaliseStreet } from './helpers/normaliseStreet.js';
import { compareWithMacrons } from './helpers/diacritics.js';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = { MAJOR: 300, MINOR: 10 };

export function processWithRef(
  addressId: AddressId,
  linzAddr: LinzAddr,
  osmAddr: OsmAddr,
  allOsmAddressesWithNoRef: OsmAddr[],
  overlapping: Overlapping,
  slowMode: boolean,
  linzAddrAlts: Record<AddressId, LinzAddr | undefined>,
): { status: Status; diagnostics?: unknown } {
  if (osmAddr.checked === CheckDate.YesRecent) {
    return { status: Status.PERFECT };
  }

  const altIssues: (Issue | false | undefined)[] = [];
  if (linzAddr.housenumberAlt) {
    const isValid = osmAddr.alts?.some(
      (a) => a.housenumber === linzAddr.housenumberAlt,
    );
    if (!isValid) {
      // need to append the alt_housenumber (no street in this case)
      altIssues.push(
        `housenumberAlt|${linzAddr.housenumberAlt}|${osmAddr.alts?.map((a) => a.housenumber).join(';') || ''}`,
      );
    }
  }

  for (const id of osmAddr.altRef || []) {
    const linzAlt = linzAddrAlts[id];
    if (!linzAlt) {
      // this ref is invalid, so remove it
      altIssues.push(`altRef|${addressId}|${id}`);
      continue;
    }

    const isStreetDifferent = linzAlt.street !== linzAddr.street;
    const alreadyExists = osmAddr.alts?.find(
      (a) =>
        a.housenumber === linzAlt.housenumber &&
        (isStreetDifferent ? a.street === linzAlt.street : true),
    );
    if (!alreadyExists) {
      const currentHouse =
        osmAddr.alts?.map((a) => a.housenumber).join(';') || '';
      const currentStreet = osmAddr.alts?.map((a) => a.street).join(';') || '';

      if (linzAlt.housenumber !== currentHouse) {
        altIssues.push(`housenumberAlt|${linzAlt.housenumber}|${currentHouse}`);
      }
      if (isStreetDifferent && linzAlt.street !== currentStreet) {
        altIssues.push(`streetAlt|${linzAlt.street}|${currentStreet}`);
      }
    }
  }

  const houseOk = linzAddr.housenumber === osmAddr.housenumber;
  const streetOk = compareWithMacrons(
    normaliseStreet(linzAddr.street),
    normaliseStreet(osmAddr.street || ''),
  );
  const suburbOk = linzAddr.suburb === osmAddr.suburb;
  const townOk = // addr:city is only conflated if the tag already exists
    !osmAddr.town ||
    !linzAddr.town ||
    linzAddr.town === linzAddr.suburb || // don't add addr:city if it duplicates addr:suburb
    linzAddr.town === osmAddr.town;
  const waterOk = linzAddr.water === osmAddr.water;
  const flatCountOk = linzAddr.flatCount === osmAddr.flatCount;

  const needsSpecialReview =
    !!osmAddr.recentlyChanged && !osmAddr.lastEditedByImporter;

  if (
    houseOk &&
    streetOk &&
    suburbOk &&
    townOk &&
    waterOk &&
    flatCountOk &&
    !altIssues.length &&
    !osmAddr.doubleSuburb
  ) {
    // looks perfect - last check is if location is correct

    const offset = geoSphericalDistance(
      [linzAddr.lng, linzAddr.lat],
      [osmAddr.lng, osmAddr.lat],
    );

    // If a feature was moved by a mapper, that's great. But if it's never
    // been touched since the original import, then we should move it when
    // LINZ updates the location. Therefore, use a much lower threshold.
    const isVeryFarOff = offset > LOCATION_THRESHOLD.MAJOR;
    const isSlightlyOff =
      offset > LOCATION_THRESHOLD.MINOR &&
      !osmAddr.isNonTrivial && // skip nonTrivial addresses (e.g. a business)
      !overlapping[getCoordKey(linzAddr.lat, linzAddr.lng)] && // respect manually unstacked clumps
      osmAddr.osmId[0] === 'n' && // skip areas
      addressId[0] !== '3' && // skip addresses from CADs
      !linzAddr.flatCount; // skip stacked addresses

    const isLocationOff = osmAddr.lastEditedByImporter
      ? isSlightlyOff
      : isVeryFarOff;
    const isMinorMove =
      !!osmAddr.lastEditedByImporter && isSlightlyOff && !isVeryFarOff;

    if (!isLocationOff) {
      // this check makes the conflation process 20 times slower, so it's
      // only run when slowMode is enabled.
      if (slowMode) {
        // The node in question is perfect, but there might be other OSM features with the
        // same address but no ref. Some common examples include:
        // - (address node with linz ref) + (address on building) added by StreetComplete user
        // - two shops with the same address - one has linz ref, the other doesn't
        const duplicateAddresses = findPotentialOsmAddresses(
          linzAddr,
          allOsmAddressesWithNoRef,
        );
        if (duplicateAddresses.length === 1) {
          // There is exactly one duplicate addresses nearby.

          const duplicate = duplicateAddresses[0];
          if (
            osmAddr.osmId[0] === 'n' && // only perfect, ref'd nodes, which are..
            !osmAddr.isNonTrivial && // ...trivial address nodes.
            duplicate.isUnRefedBuilding // And the building must not have a ref.
          ) {
            // The only situation that we specifically handle is the
            // straightforward StreetComplete case - where a building
            // and a simple address node duplicate each other.
            return validate({
              status: Status.REPLACED_BY_BUILDING,
              diagnostics: [osmAddr, duplicate, linzAddr.suburb],
            });
          }
        }
      }

      return { status: Status.PERFECT };
    }

    return validate({
      status: Status.EXISTS_BUT_LOCATION_WRONG,
      diagnostics: [
        linzAddr.suburb,
        Math.round(offset),
        osmAddr,
        linzAddr.lat,
        linzAddr.lng,
        osmAddr.lat,
        osmAddr.lng,
        isMinorMove,
      ],
    });
  }

  const townNeedsChangingBcSuburbChanged =
    !suburbOk && // if suburb is not okay,
    !!osmAddr.town && // and there is a town
    linzAddr.town !== linzAddr.suburb && // but don't add addr:city if it duplicates addr:suburb
    linzAddr.town !== osmAddr.town; // and don't do anything if osm already has the correct value

  // something is wrong in the data
  const issues: (Issue | false | undefined)[] = [
    !houseOk && `housenumber|${linzAddr.housenumber}|${osmAddr.housenumber}`,
    !streetOk && `street|${linzAddr.street}|${osmAddr.street}`,
    !suburbOk && `suburb|${linzAddr.suburb || ''}|${osmAddr.suburb || ''}`,
    // if the `suburb` is changing, also conflate `town`
    (!townOk || townNeedsChangingBcSuburbChanged) &&
      `town|${linzAddr.town}|${osmAddr.town || ''}`,
    !flatCountOk &&
      `flatCount|${linzAddr.flatCount || 0}|${osmAddr.flatCount || 0}`,
    ...altIssues,

    // this is the buggy one (see #7) if it's a double suburb, the system may think `suburbOk` but it's wrong
    (osmAddr.doubleSuburb || (!suburbOk && osmAddr.hasHamlet)) &&
      'doubleSuburb||',

    !waterOk &&
      `water|${+(linzAddr.water || false)}|${+(osmAddr.water || false)}`,
  ];

  return validate({
    status: Status.EXISTS_BUT_WRONG_DATA,
    diagnostics: [
      osmAddr,
      linzAddr.suburb,
      needsSpecialReview,
      ...issues.filter((x): x is Issue => !!x),
    ],
  });
}
