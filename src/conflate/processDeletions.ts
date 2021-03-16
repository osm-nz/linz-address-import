import {
  DeletionData,
  LinzData,
  OsmAddr,
  OSMData,
  Status,
  StatusReport,
} from '../types';

const isNonTrivial = (addr: OsmAddr) =>
  addr.osmId[0] !== 'n' || addr.isNonTrivial;

export function processDeletions(
  deletionData: DeletionData,
  osmData: OSMData,
  linzData: LinzData,
): [ret: Partial<StatusReport>, removeFromCreate: string[]] {
  const linzByKey: Record<string, Record<string, string>> = {};
  for (const linzId in linzData) {
    const a = linzData[linzId];
    const suburb = a.suburb[1];
    linzByKey[suburb] ||= {};
    const key = a.housenumber! + a.street!;
    linzByKey[suburb][key] = linzId;
  }

  const needsDeleteTrivial = deletionData.filter(
    ([linzId]) => osmData.linz[linzId] && !isNonTrivial(osmData.linz[linzId]),
  );
  const needsDeleteNonTrivial = deletionData.filter(
    ([linzId]) => osmData.linz[linzId] && isNonTrivial(osmData.linz[linzId]),
  );

  /** keep track of a list of new linzRefs that we should remove from which ever status they're in */
  const removeFromCreate: string[] = [];

  // send stuff to the sus if we're supposed to delete it, but also create an identical one. The linz ref must have changed
  const normal: StatusReport[Status.NEEDS_DELETE] = [];
  const sus: StatusReport[Status.LINZ_REF_CHANGED] = [];
  const error: StatusReport[Status.UNKNOWN_ERROR] = [];

  for (const item of needsDeleteTrivial) {
    const [linzRef, suburb] = item;
    const osmAddr = osmData.linz[linzRef]!;

    const key = osmAddr.housenumber! + osmAddr.street!;
    const newLinzRef = linzByKey[suburb]?.[key];
    if (newLinzRef) {
      if (newLinzRef === linzRef) {
        // It's concerning how this could happen. LINZ deleted the address,
        // but must have un-deleted it, because the last dump from LINZ contains
        // this address.
        error.push([linzRef, osmAddr.osmId]);
      } else {
        sus.push([linzRef, [suburb, newLinzRef, osmAddr]]);
      }
      removeFromCreate.push(newLinzRef);
    } else {
      normal.push([linzRef, [suburb, osmAddr]]);
    }
  }

  const ret: Partial<StatusReport> = {
    [Status.NEEDS_DELETE]: normal,
    [Status.LINZ_REF_CHANGED]: sus,
    [Status.UNKNOWN_ERROR]: error,
    [Status.NEEDS_DELETE_NON_TRIVIAL]: needsDeleteNonTrivial.map(
      ([linzId, suburb]) => [linzId, [suburb, osmData.linz[linzId]]],
    ),
  };
  return [ret, removeFromCreate];
}
