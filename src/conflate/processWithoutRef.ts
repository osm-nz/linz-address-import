import {
  LinzAddr,
  OsmAddrWithConfidence,
  Status,
  StatusDiagnostics,
} from '../types';
import { validate } from './helpers/validate';

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
      diagnostics: [osmAddrs[0].confidence, osmAddrs[0].osmId],
    });
  }

  return validate({
    status: Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF,
    diagnostics: osmAddrs.map((o) => [
      o.confidence,
      o.osmId,
    ]) as StatusDiagnostics[Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF],
  });
}
