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

  const ret: Partial<StatusReport> = {
    [Status.NEEDS_DELETE]: normal.filter(
      ([linzId]) => !isNonTrivial(osmData.linz[linzId]),
    ),
    [Status.LINZ_REF_CHANGED]: sus,

    // FIXME: make this simply remove the tags from buildings (new cat. Non trivial just means a business)
    [Status.NEEDS_DELETE_NON_TRIVIAL]: normal.filter(([linzId]) =>
      isNonTrivial(osmData.linz[linzId]),
    ),
  };
  return [ret, removeFromCreate];
}
