import { geoSphericalDistance } from '@id-sdk/geo';
import {
  Confidence,
  type LinzAddr,
  type OsmAddr,
  type OsmAddrWithConfidence,
} from '../types.js';

// using the mutating Object.assign because it's computationally cheaper than object spread
const withC =
  (confidence: Confidence) =>
  (p: OsmAddr): OsmAddrWithConfidence =>
    Object.assign(p, { confidence });

/** If there are multiple osm addresses found, none of which have a linz ref, find the most likely ones */
export const findPotentialOsmAddresses = (
  linzAddr: LinzAddr,
  osmData: OsmAddr[],
): OsmAddrWithConfidence[] => {
  const f1 = osmData.filter(
    (osmAddr) =>
      osmAddr.housenumber === linzAddr.housenumber &&
      osmAddr.street === linzAddr.street,
  );

  const perfectMatches = f1.filter(
    (osmAddr) => osmAddr.suburb === linzAddr.suburb,
  );
  // simplest case if the housenumber, street, AND suburb are all intract.
  // Someone probably just deleted the ref tag
  if (perfectMatches.length === 1) {
    return perfectMatches.map(withC(Confidence.CERTAIN));
  }

  // if theres no perfect match, see if there are any with matching housenumber &
  // street (but not suburb). sort by closest to the correct location
  const almostPerfect = f1
    .map((osmAddr) => {
      const offset = geoSphericalDistance(
        [osmAddr.lng, osmAddr.lat],
        [linzAddr.lng, linzAddr.lat],
      );

      // if our best guess is more than 200m from the gazetted location, it's definitely wrong
      if (offset > 200) return undefined;

      // mutating assign is cheaper than spread
      return Object.assign(osmAddr, {
        offset,
        confidence: Confidence.NORMAL,
      });
    })
    .filter(<T>(x: T | undefined): x is T => !!x)
    .sort((a, b) => a.offset - b.offset);

  if (almostPerfect.length) {
    // marginally faster than [...spread]
    return Reflect.apply(
      Array.prototype.concat,
      perfectMatches.map(withC(Confidence.HIGH_BUT_MULTIPLE)),
      almostPerfect,
    );
  }

  // we're not confident enough about any of the possible addresses, so return nothing. or perfect matches if there are 2+
  return perfectMatches.map(withC(Confidence.HIGH_BUT_MULTIPLE));
};
