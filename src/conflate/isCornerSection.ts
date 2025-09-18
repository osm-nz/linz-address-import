import {
  type AddressId,
  type Issue,
  type LinzAddr,
  type LinzData,
  type OSMData,
  type ParcelToAddress,
  Status,
} from '../types.js';
import { validate } from './helpers/validate.js';

/**
 * many years ago, LINZ said they'd publish a dataset of 'Alternate Addresses',
 * but that never eventuated. So many corner sections still have 2 address nodes.
 * There's no reliable way to detect this case, so we use a few heuristics:
 *  - There are exactly 2 addresses in this parcel
 *  - Neither address is a flat (23A or 1/23)
 *
 * In this case we will either:
 *  - create 2 address nodes (as per normal); or
 *  - if one address is aleady merged into the building, we will merge the
 *    alternative address into the building using `alt_addr:*`
 *
 * The biggest caveat is that this only works if both addresses are from AIM
 * (prefix of 2). Addresses from CADS (prefix of 3) don't have a parcelId, and
 * it's too computationally expensive for us to derive this ourselves.
 */
export function isCornerSection(
  linzId: AddressId,
  linzAddr: LinzAddr,
  linzData: LinzData,
  parcelToAddress: ParcelToAddress,
  osmData: OSMData,
) {
  const siblingAddrs = linzAddr.parcelId && parcelToAddress[linzAddr.parcelId];

  // we need exactly 2 addresses in this section
  if (siblingAddrs?.length !== 2) return undefined;

  /** the "other" is the main one that's already in OSM */
  const otherAddressId = siblingAddrs.find((id) => id !== linzId)!;
  const otherAddress = linzData[otherAddressId];

  // not supported if either address is already recognised as alt
  if (otherAddress.housenumberAlt || linzAddr.housenumberAlt) return undefined;

  // not supported if either one is a flat (e.g. 23A or 1/23)
  const eitherIsFlat =
    otherAddress.housenumber !== otherAddress.$houseNumberMsb ||
    linzAddr.housenumber !== linzAddr.$houseNumberMsb;
  if (eitherIsFlat) return undefined;

  const otherAddressOsm = osmData.linz[otherAddressId];

  // the other address does not exist in OSM
  // keep in mind, this function is called twice for every pair.
  if (!otherAddressOsm) return undefined;

  // we won't suggest merging nodes, only buildings, unless it already
  // has some alt_ tags
  const isNode = otherAddressOsm.osmId[0] === 'n';
  const hasAnyAltTags = !!(
    otherAddressOsm.altRef ||
    otherAddressOsm.housenumberAlt ||
    otherAddressOsm.streetAlt
  );

  if (isNode && !hasAnyAltTags) return undefined;

  const newMergedRef = `${otherAddressId};${linzId}`;
  const existingRef = [otherAddressId, otherAddressOsm.altRef]
    .filter(Boolean)
    .join(';');

  const issues: Issue[] = [`altRef|${newMergedRef}|${existingRef}`];

  if (linzAddr.housenumber !== otherAddressOsm.housenumberAlt) {
    issues.push(
      `housenumberAlt|${linzAddr.housenumber}|${otherAddressOsm.housenumberAlt || ''}`,
    );
  }
  if (linzAddr.street !== otherAddressOsm.streetAlt) {
    issues.push(
      `streetAlt|${linzAddr.street}|${otherAddressOsm.streetAlt || ''}`,
    );
  }

  return validate({
    status: Status.EXISTS_BUT_WRONG_DATA,
    diagnostics: [otherAddressOsm, linzAddr.suburb, false, ...issues],
  });
}
