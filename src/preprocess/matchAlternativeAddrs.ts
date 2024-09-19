import type { LinzData, OSMData } from '../types.js';
import type { VisitedCoords } from './stackLinzData.js';

/**
 * a “duplicate” = an “alternative address”, e.g. when
 * 12A and 1/12 refer to the same physical appartment,
 * but for whatever reason LINZ has duplicate entries.
 *
 * This didn't use to be a problem until LINZ rolled out
 * the new dataset which is full of nonsense entries.
 *
 * Contacted LINZ on 2023-02-07, they said they have
 * cancelled their plan to add a field to indiciate which
 * addresses are “alternate addresses” (i.e. duplicates).
 *
 * So we have to manually guess if an address is a duplicate.
 * A duplicate always has at least one 3xxx ID (i.e. from CADS).
 * For now, we only handle the case where we have:
 * 1/12, 2/12, 3/12 and 12A, 12B, 12C, for a 3-flat apartment.
 */
export function matchAlternativeAddrs(
  linzData: LinzData,
  osmData: OSMData,
  singleLinzId: string | undefined,
  addrIds: VisitedCoords[string],
) {
  // less than 2 units, so skip, because:
  //   (a) there are geunine cases where there are
  //       12, 12A, and 1/12, each of which are separate
  //       houses — but the number of adjacent cases is
  //       virtually 0.
  //   (b) there is minimal benefit to merging 2 units given
  //       the risk that it could be a false positive.
  if (addrIds.length < 4) return undefined;

  // if any have linz:stack=no, then abort. That means
  // someone deliberately doesn't want these to be consolidated.
  const anyHavePerserveTag = addrIds.some(
    ([addrId]) => osmData.linz[addrId]?.stackRequest === false,
  );
  if (anyHavePerserveTag) return undefined;

  const duplicateMap: Record<string, string> = {};

  const houseNumberMsb = linzData[addrIds[0][0]].$houseNumberMsb;

  // eslint-disable-next-line no-constant-condition
  for (let unitNumber = 1; true; unitNumber++) {
    const unitLetter = String.fromCodePoint(64 + unitNumber); // uppercase

    // try to find 12A
    const [letter] =
      addrIds.find(
        ([addrId]) =>
          linzData[addrId].housenumber === houseNumberMsb + unitLetter,
      ) || [];
    if (!letter) break; // abort early to improve pref

    // try to find 1/12
    const [number] =
      addrIds.find(
        ([addrId]) =>
          linzData[addrId].housenumber === `${unitNumber}/${houseNumberMsb}`,
      ) || [];
    if (!number) break; // abort early to improve pref

    // length check is required because some very old addresses have
    // 4 or 5 digit IDs which coincidentally start with a 3. There is a field
    // that tells us the `source_dataset`, but this is cheaper and requires
    // storing less data.
    const letterIsFromCADS = letter[0] === '3' && letter.length >= 7;
    const numberIsFromCADS = number[0] === '3' && number.length >= 7;

    const eitherIsFromCADS = letterIsFromCADS || numberIsFromCADS;
    if (!eitherIsFromCADS) break; // abort early to improve pref

    // if we've got to here, then pick the address that
    // is not from CADS as the one to keep. The other one
    // becomes the alt_addr:housenumber.
    if (letterIsFromCADS) {
      duplicateMap[number] = letter;
    } else {
      duplicateMap[letter] = number;
    }

    // all good, so check the next unit until we
    // find a pair with no matching letter/number.
  }

  const addrIdsToSkip = new Set(Object.values(duplicateMap));

  // we're at the end, so check if we've visited everything.
  const seenEverything = addrIds.every(([addrId]) => {
    // alow the root address (i.e. 12 in our example)
    const isRoot =
      linzData[addrId].housenumber === linzData[addrId].$houseNumberMsb;

    return addrIdsToSkip.has(addrId) || duplicateMap[addrId] || isRoot;
  });

  // if someone has manually added alt_addr:housenumber, then
  // we respect that.
  const someAlreadyHaveAltTag = addrIds.some(
    ([addrId]) => osmData.linz[addrId]?.housenumberAlt,
  );

  if (seenEverything || someAlreadyHaveAltTag) {
    return { duplicateMap, addrIdsToSkip };
  }
  return undefined;
}
