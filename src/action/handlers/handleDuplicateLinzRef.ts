import type { MutliFeatureConflationResult } from '@osm-conflation-engine/cli';
import { toLink } from '../util/const.js';
import { type CallbackFunctions, Status } from '../../types.js';
import { isNonTrivial } from '../util/linzAddrToTags.js';
import { addToReport } from '../../conflate/report.js';
import { getLocalKeyForOsm, getLocalKeyForSource } from '../../localKeys.js';
import { REF_TAG } from '../../config.js';

export const mergeOneToMany: CallbackFunctions['mergeOneToMany'] = ({
  osm: osmAddrList,
  source,
}) => {
  const { properties: linzAddr } = source;
  // this means there mutiple nodes in OSM with the same address ref.
  // we need to delete one of them.

  const autofixable: Record<string, '✅' | '⚠️'> = {};
  const result: MutliFeatureConflationResult = {
    group: `Merge duplicate addresses - ${source.properties.suburb}`,
    diffPerFeature: {},
  };

  const simpleNodes = osmAddrList
    .filter((osmAddr) => osmAddr.id[0] === 'n' && !isNonTrivial(osmAddr.tags))
    // if there are duplicates, keep the oldest node (determined by the node ID)
    .toSorted((a, b) => +a.id.slice(1) - +b.id.slice(1));

  // we can autofix this if some of the duplicates are simple nodes

  // another case we can autofix is if one node has info that doesn't match the linz ref
  // e.g. No.12 and No.12A both have the linz ref for No.12
  const correctKey = getLocalKeyForSource(source);
  const idDoesntMatchAddr = osmAddrList.filter(
    (osmAddr) => getLocalKeyForOsm(osmAddr) !== correctKey,
  );

  if (idDoesntMatchAddr.length) {
    for (const dodgyAddr of idDoesntMatchAddr) {
      // we won't delete it - if it's got mismatched data it's probably a correct address,
      // someone just copy-pasted the ref tag from another addr
      result.diffPerFeature[dodgyAddr.id] = {
        tags: { __action: 'edit', [REF_TAG]: '🗑️' },
      };
      autofixable[linzAddr.id] = '✅';
    }
  } else if (simpleNodes.length) {
    // Either (a) all nodes are simple. Pick the oldest 1 to keep and delete the rest.
    // Or     ( b) notall of the addresses are simple, so delete only the simple ones.
    const toDelete =
      simpleNodes.length === osmAddrList.length
        ? simpleNodes.slice(1)
        : simpleNodes;

    const notFullyFixed = osmAddrList.length - simpleNodes.length > 1;

    // delete the simple nodes
    for (const addr of toDelete) {
      result.diffPerFeature[addr.id] = { tags: { __action: 'delete' } };
    }
    autofixable[linzAddr.id] = notFullyFixed ? '⚠️' : '✅';
  }

  addToReport(
    Status.MULTIPLE_EXIST,
    linzAddr.suburb,
    `${linzAddr.id}\t${autofixable[linzAddr.id] || '❌'}\texists on ${osmAddrList
      .map((osmAddr) => toLink(osmAddr.id))
      .join(' and ')}`,
  );

  return result;
};
