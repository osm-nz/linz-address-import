import type { OsmFeature } from 'osm-api';
import type { AddressId, Tags } from '../types.js';
import type { IgnoredAddr } from './api/index.js';
import type { CSWithDiff } from './patchOsmChange.js';

const addressTags = ['ref:linz:address_id', 'addr:housenumber', 'addr:steet'];

const hasAddress = (x: OsmFeature) =>
  x.tags && addressTags.some((tag) => tag in x.tags!);

const tagsToKey = (tags: Tags) =>
  `${tags['addr:housenumber']} ${tags['addr:steet']}`;

export function checkDiffsForAddress(list: CSWithDiff[]): IgnoredAddr[] {
  const out: IgnoredAddr[] = [];
  for (const { cs, diff } of list) {
    const create = diff.create.filter(hasAddress);
    const modify = diff.modify.filter(hasAddress);
    const remove = diff.delete.filter(hasAddress);

    const deletedAddresses: Record<AddressId, OsmFeature> = {};

    /** e.g. { '12 Example St': '[LINZ ref]' } */
    const seenAddresses: Record<string, AddressId> = {};

    // add all deleted features to the list first
    for (const feat of remove) {
      const addrId = <AddressId>feat.tags!['ref:linz:address_id'];
      deletedAddresses[addrId] = feat;

      seenAddresses[tagsToKey(feat.tags!)] = addrId;
    }

    // then remove all addrIds that were added back to a different feature
    for (const feat of [...modify, ...create]) {
      const addrId = <AddressId>feat.tags!['ref:linz:address_id'];
      if (addrId) {
        delete deletedAddresses[addrId];
      } else {
        // This is an address the user created or updated, which doesn't have a ref:... tag.
        // So we check if this is this new address is identical to one that was deleted.
        // if so, we won't add this address to the ignore-list.
        const maybeLinzAddr = seenAddresses[tagsToKey(feat.tags!)];
        if (maybeLinzAddr) delete deletedAddresses[maybeLinzAddr];
      }
    }

    const issues = Object.entries(deletedAddresses)
      .filter(([, osmFeature]) => osmFeature.tags!['ref:linz:address_id'])
      .map(([addrId, osmFeature]) => {
        return {
          addrId: <AddressId>addrId,
          streetAddress: `${osmFeature.tags!['addr:housenumber']} ${
            osmFeature.tags!['addr:street']
          }`,
          suburb:
            osmFeature.tags!['addr:suburb'] || osmFeature.tags!['addr:hamlet'],
          user: cs.user,
          date: cs.closed_at,
          isDataError: false,
          comment: `cs${cs.id} (${cs.tags.created_by?.split(' ')[0]}): ${
            cs.tags.comment
          }`,
        };
      });
    out.push(...issues);
  }
  return out;
}
