import type { CallbackFunctions } from '../types.js';
import { LAYER_PREFIX } from './helpers/const.js';
import { isNonTrivial, linzAddrToTags } from './helpers/linzAddrToTags.js';
import { mergeOneToOne } from './processWithRef.js';

export const processWithoutRef: CallbackFunctions['create'] = ({
  source,
  osmCandidates: osmAddrs,
}) => {
  const { properties: linzAddr } = source;
  // no potential match found
  if (!osmAddrs.length) {
    return {
      selection: undefined,
      category: LAYER_PREFIX,
      group: `${linzAddr.suburb}, ${linzAddr.town}`,
      diff: { tags: linzAddrToTags(linzAddr) },
    };
  }

  // exactly 1 match found, so update that one
  if (osmAddrs.length === 1) {
    const osmAddr = osmAddrs[0];

    return {
      selection: osmAddr.id,
      ...mergeOneToOne({ source, osm: osmAddr }),
    };
  }

  // we need to pick which one to add the address-ref to. It's not that important
  // which one we choose. We prefer buildings or POIs. Failing that, we just pick
  // a random one.
  const chosenOsmAddr =
    osmAddrs.find((o) => o.id[0] !== 'n' || isNonTrivial(o.tags)) ||
    osmAddrs[0];

  return {
    selection: chosenOsmAddr.id,
    ...mergeOneToOne({ source, osm: osmAddrs[0] }),
  };
};
