import { type LinzAddr, type OsmAddrWithConfidence, Status } from '../types.js';
import { validate } from './helpers/validate.js';

export function processWithoutRef(
  addressId: string,
  linzData: LinzAddr,
  osmAddrs: OsmAddrWithConfidence[],
): { status: Status; diagnostics?: unknown } {
  // no potential match found
  if (!osmAddrs.length) {
    return validate({
      status: Status.TOTALLY_MISSING,
      diagnostics: linzData,
    });
  }

  if (osmAddrs.length === 1) {
    return validate({
      status: Status.EXISTS_BUT_NO_LINZ_REF,
      diagnostics: [linzData.suburb, osmAddrs[0].confidence, osmAddrs[0]],
    });
  }

  // at this point confidence will always be 3 (Confidence.HIGH_BUT_MULTIPLE)

  // we need to pick which one to add the address-ref to. It's not that important
  // which one we choose. We prefer buildings or POIs. Failing that, we just pick
  // a random one.
  const chosenOsmAddr =
    osmAddrs.find((o) => o.osmId[0] !== 'n' || o.isNonTrivial) || osmAddrs[0];

  const allOsmIds = osmAddrs.map((o) => o.osmId);

  return validate({
    status: Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF,
    diagnostics: [linzData.suburb[1], chosenOsmAddr, allOsmIds],
  });
}
