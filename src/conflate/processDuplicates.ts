import { LinzAddr, OsmAddr, Status } from '../types';
import { validate } from './helpers/validate';

export function processDuplicates(
  linzId: string,
  linzAddr: LinzAddr,
  duplicate: OsmAddr[],
): { status: Status; diagnostics: unknown } {
  return validate({
    status: Status.MULTIPLE_EXIST,
    diagnostics: duplicate.map((x) => x.osmId),
  });
}
