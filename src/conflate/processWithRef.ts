import { CheckDate, Issue, LinzAddr, OsmAddr, Status } from '../types';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses';
import { distanceBetween } from './helpers/geo';
import { validate } from './helpers/validate';

/** distance in metres beyond which we classify the address as `EXISTS_BUT_LOCATION_WRONG` */
const LOCATION_THRESHOLD = 300;

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
  const townOk = // addr:city is only conflated if the tag already exists
    !osmAddr.town ||
    !linzAddr.town ||
    linzAddr.town === linzAddr.suburb[1] || // don't add addr:city if it duplicates addr:suburb
    linzAddr.town === osmAddr.town;
  const waterOk = linzAddr.water === osmAddr.water;
  const flatCountOk = linzAddr.flatCount === osmAddr.flatCount;
  const levelOk = !linzAddr.level || linzAddr.level === osmAddr.level;

  if (
    houseOk &&
    streetOk &&
    suburbOk &&
    townOk &&
    waterOk &&
    flatCountOk &&
    levelOk &&
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

  const townNeedsChangingBcSuburbChanged =
    !suburbOk && // if suburb is not okay,
    !!(linzAddr.town || osmAddr.town) && // and there is a town, or there is meant to be a town,
    linzAddr.town !== linzAddr.suburb[1]; // but don't add addr:city if it duplicates addr:suburb

  // something is wrong in the data
  const issues: (Issue | false | undefined)[] = [
    !houseOk && `housenumber|${linzAddr.housenumber}|${osmAddr.housenumber}`,
    !streetOk && `street|${linzAddr.street}|${osmAddr.street}`,
    !suburbOk && `suburb|${linzSuburb}|${osmSuburb}`,
    // if the `suburb` is changing, also conflate `town`
    (!townOk || townNeedsChangingBcSuburbChanged) &&
      `town|${linzAddr.town}|${osmAddr.town || ''}`,
    !flatCountOk &&
      `flatCount|${linzAddr.flatCount || 0}|${osmAddr.flatCount || 0}`,
    !levelOk && `level|${linzAddr.level || ''}|${osmAddr.level || ''}`,

    // this is the buggy one (see #7) if it's a double suburb, the system may think `suburbOk` but it's wrong
    suburbOk &&
      osmAddr.doubleSuburb &&
      `suburb|${linzSuburb}|${inverse(linzSuburb)}`, // we want the wrong one to be in the diagnostic

    !waterOk &&
      `water|${+(linzAddr.water || false)}|${+(osmAddr.water || false)}`,
  ];

  return validate({
    status: Status.EXISTS_BUT_WRONG_DATA,
    diagnostics: [
      osmAddr,
      linzAddr.suburb[1],
      ...issues.filter((x): x is Issue => !!x),
    ],
  });
}
