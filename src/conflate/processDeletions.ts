import {
  type AddressId,
  type DeletionData,
  type LinzData,
  type OSMData,
  Status,
  type StatusReport,
} from '../types.js';

export function processDeletions(
  deletionData: DeletionData,
  osmData: OSMData,
  linzData: LinzData,
): [ret: Partial<StatusReport>, removeFromCreate: string[]] {
  const linzByKey: Record<string, Record<string, AddressId>> = {};
  for (const _linzId in linzData) {
    const linzId = <AddressId>_linzId;
    const a = linzData[linzId];
    const suburb = a.suburb;
    linzByKey[suburb] ||= {};
    const key = a.housenumber! + a.street!;
    linzByKey[suburb][key] = linzId;
  }

  /** keep track of a list of new linzRefs that we should remove from which ever status they're in */
  const removeFromCreate: string[] = [];

  // send stuff to the sus if we're supposed to delete it, but also create an identical one. The linz ref must have changed
  const normal: StatusReport[Status.NEEDS_DELETE] = [];
  const sus: StatusReport[Status.LINZ_REF_CHANGED] = [];

  for (const item of deletionData) {
    const [linzRef, suburb] = item;
    const osmAddr = osmData.linz[linzRef]!;

    const key = osmAddr.housenumber! + osmAddr.street!;
    const newLinzRef = linzByKey[suburb]?.[key];
    if (newLinzRef) {
      if (osmData.linz[newLinzRef]) {
        // linz ref changed && new one is already in osm -> so basically it didn't change. Normal delete
        // probably because address accidently existed twice in the LINZ db, with 2 different refs and LINZ fixed it by deleting one.

        // this could also happen if a stack is mapped twice due to the bug from osm-nz/linz-address-import#8
        normal.push([linzRef, [suburb, osmAddr]]);
      } else {
        // linz ref changed, and the new ref doesn't exist in OSM
        sus.push([
          linzRef,
          [suburb, newLinzRef, osmAddr, linzData[newLinzRef]],
        ]);
        removeFromCreate.push(newLinzRef);
      }
    } else {
      normal.push([linzRef, [suburb, osmAddr]]);
    }
  }

  const returnValue: Partial<StatusReport> = {
    [Status.NEEDS_DELETE]: normal.filter(
      ([, [, osmAddr]]) => !osmAddr.isNonTrivial && osmAddr.osmId[0] === 'n',
    ),
    [Status.LINZ_REF_CHANGED]: sus,

    [Status.NEEDS_DELETE_NON_TRIVIAL]: normal.filter(
      ([, [, osmAddr]]) => osmAddr.isNonTrivial,
    ),

    [Status.NEEDS_DELETE_ON_BUILDING]: normal.filter(
      ([, [, osmAddr]]) => !osmAddr.isNonTrivial && osmAddr.osmId[0] !== 'n',
    ),
  };
  return [returnValue, removeFromCreate];
}
