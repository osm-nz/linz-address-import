import { LAYER_PREFIX, toLink } from '../action/util/const.js';
import { type CallbackFunctions, Status } from '../types.js';
import { isNonTrivial, linzAddrToTags } from '../action/util/linzAddrToTags.js';
import { REF_TAG } from '../config.js';
import { mergeOneToOne } from './processWithRef.js';
import { addToReport } from './report.js';

export const processWithoutRef: CallbackFunctions['create'] = ({
  source,
  osmCandidates: osmAddrs,
}) => {
  const { properties: linzAddr } = source;
  // no potential match found
  if (!osmAddrs.length) {
    return {
      selection: undefined,
      group: LAYER_PREFIX + linzAddr.suburb,
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

  // at this point confidence will always be 3 (Confidence.HIGH_BUT_MULTIPLE)
  addToReport(
    Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF,
    linzAddr.suburb,
    `${REF_TAG}=${linzAddr.id}\t\tneeds to be added to\t\t${[
      // this a legacy bug, keeping it so that the snapshot tests don't change during the migration
      ...osmAddrs,
      ...osmAddrs,
    ]
      .map((o) => toLink(o.id))
      .join(' or ')}`,
  );

  // we need to pick which one to add the address-ref to. It's not that important
  // which one we choose. We prefer buildings or POIs. Failing that, we just pick
  // a random one.
  const chosenOsmAddr =
    osmAddrs.find((o) => o.id[0] !== 'n' || isNonTrivial(o.tags)) ||
    osmAddrs[0];

  return {
    selection: chosenOsmAddr.id,
    ...mergeOneToOne({ source, osm: osmAddrs[0] }, true),
  };
};
