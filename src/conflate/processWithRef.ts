import {
  CheckDate,
  LinzAddr,
  OsmAddr,
  Status,
  StatusDiagnostics,
} from '../types';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses';
import { distanceBetween } from './helpers/geo';
import { validate } from './helpers/validate';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = 300;

const isTruthy = <T>(x: T | undefined | false | null | 0): x is T => !!x;

/** swap suburb <=> hamlet */
const inverse = (linz: string) => {
  const [k, v] = linz.split('=');
  const swappedK = k === 'addr:hamlet' ? 'addr:suburb' : 'addr:hamlet';
  return [swappedK, v].join('=');
};

export function processWithRef(
  _addressId: string,
  linzAddr: LinzAddr,
  osmAddr: OsmAddr,
  allOsmAddressesWithNoRef: OsmAddr[],
  slowMode?: boolean,
): { status: Status; diagnostics?: unknown } {
  if (osmAddr.checked === CheckDate.YesRecent) {
    return { status: Status.PERFECT };
  }

  const linzSuburb = `${
    linzAddr.suburb[0] === 'U' ? 'addr:suburb' : 'addr:hamlet'
  }=${linzAddr.suburb[1]}`;
  const osmSuburb = osmAddr.suburb
    ? `${osmAddr.suburb[0] === 'U' ? 'addr:suburb' : 'addr:hamlet'}=${
        osmAddr.suburb[1]
      }`
    : 0;

  const houseOk = linzAddr.housenumber === osmAddr.housenumber;
  const streetOk = linzAddr.street === osmAddr.street;
  const suburbOk = linzSuburb === osmSuburb;
  const waterOk = linzAddr.water === osmAddr.water;
  const flatCountOk = linzAddr.flatCount === osmAddr.flatCount;

  if (
    houseOk &&
    streetOk &&
    suburbOk &&
    waterOk &&
    flatCountOk &&
    !osmAddr.doubleSuburb
  ) {
    // looks perfect - last check is if location is correct

    const offset = distanceBetween(
      linzAddr.lat,
      linzAddr.lng,
      osmAddr.lat,
      osmAddr.lng,
    );

    if (offset < LOCATION_THRESHOLD) {
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
              diagnostics: [osmAddr, duplicate, linzAddr.suburb[1]],
            });
          }
        }
      }

      return { status: Status.PERFECT };
    }

    return validate({
      status: Status.EXISTS_BUT_LOCATION_WRONG,
      diagnostics: [
        Math.round(offset),
        osmAddr,
        linzAddr.lat,
        linzAddr.lng,
        osmAddr.lat,
        osmAddr.lng,
      ],
    });
  }

  // something is wrong in the data

  return validate({
    status: Status.EXISTS_BUT_WRONG_DATA,
    diagnostics: [
      osmAddr,
      linzAddr.suburb[1],
      !houseOk && `housenumber|${linzAddr.housenumber}|${osmAddr.housenumber}`,
      !streetOk && `street|${linzAddr.street}|${osmAddr.street}`,
      !suburbOk && `suburb|${linzSuburb}|${osmSuburb}`,
      !flatCountOk &&
        `flatCount|${linzAddr.flatCount || 0}|${osmAddr.flatCount || 0}`,

      // this is the buggy one (see #7) if it's a double suburb, the system may think `suburbOk` but it's wrong
      suburbOk &&
        osmAddr.doubleSuburb &&
        `suburb|${linzSuburb}|${inverse(linzSuburb)}`, // we want the wrong one to be in the diagnostic

      !waterOk &&
        `water|${+(linzAddr.water || false)}|${+(osmAddr.water || false)}`,
    ].filter(isTruthy) as StatusDiagnostics[Status.EXISTS_BUT_WRONG_DATA],
  });
}
