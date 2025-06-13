import {
  type AddressId,
  type LinzAddr,
  type OsmAddr,
  Status,
} from '../types.js';
import { validate } from './helpers/validate.js';

export function processDuplicates(
  linzId: AddressId,
  linzAddr: LinzAddr,
  duplicate: OsmAddr[],
): { status: Status; diagnostics: unknown } {
  return validate({
    status: Status.MULTIPLE_EXIST,
    diagnostics: [linzAddr, duplicate],
  });
}
