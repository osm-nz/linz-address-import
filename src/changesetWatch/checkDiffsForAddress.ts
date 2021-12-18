import type { OsmFeature } from 'osm-api';
import type { IgnoredAddr } from './api';
import { CSWithDiff } from './patchOsmChange';

const hasAddress = (x: OsmFeature) => x.tags?.['ref:linz:address_id'];

export function checkDiffsForAddress(list: CSWithDiff[]): IgnoredAddr[] {
  const out: IgnoredAddr[] = [];
  for (const { cs, diff } of list) {
    const create = diff.create.filter(hasAddress);
    const modify = diff.modify.filter(hasAddress);
    const remove = diff.delete.filter(hasAddress);

    const deletedAddresses: Record<string, OsmFeature> = {};

    // add all deleted features to the list first
    for (const feat of remove) {
      const addrId = feat.tags!['ref:linz:address_id'];
      deletedAddresses[addrId] = feat;
    }

    // then remove all addrIds that were added back to a different feature
    for (const feat of create) {
      const addrId = feat.tags!['ref:linz:address_id'];
      delete deletedAddresses[addrId];
    }
    for (const feat of modify) {
      const addrId = feat.tags!['ref:linz:address_id'];
      delete deletedAddresses[addrId];
    }

    const issues = Object.entries(deletedAddresses).map(
      ([addrId, osmFeature]) => {
        return {
          addrId,
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
      },
    );
    out.push(...issues);
  }
  return out;
}
