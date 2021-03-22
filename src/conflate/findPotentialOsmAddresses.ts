import { Confidence, LinzAddr, OsmAddr, OsmAddrWithConfidence } from '../types';
import { distanceBetween } from './helpers/geo';

// using the mutating Object.assign because it's computationally cheaper than object spread
const withC = (confidence: Confidence) => (p: OsmAddr): OsmAddrWithConfidence =>
  Object.assign(p, { confidence });

/** If there are multiple osm addresses found, none of which have a linz ref, find the most likely ones */
export const findPotentialOsmAddresses = (
  linzAddr: LinzAddr,
  osmData: OsmAddr[],
): OsmAddrWithConfidence[] => {
  const perfectMatches = osmData.filter(
    (osmAddr) =>
      osmAddr.housenumber === linzAddr.housenumber &&
      osmAddr.street === linzAddr.street &&
      osmAddr.suburb &&
      osmAddr.suburb[0] === linzAddr.suburb[0] &&
      osmAddr.suburb[1] === linzAddr.suburb[1],
  );
  // simplest case if the housenumber, street, AND suburb are all intract.
  // Someone probably just deleted the ref tag
  if (perfectMatches.length === 1) {
    return perfectMatches.map(withC(Confidence.CERTAIN));
  }

  // if theres no perfect match, see if there are any with matching housenumber &
  // street (but not suburb). sort by closest to the correct location
  const almostPerfect = osmData
    .filter(
      (osmAddr) =>
        osmAddr.housenumber === linzAddr.housenumber &&
        osmAddr.street === linzAddr.street,
    )
    .map((osmAddr) => {
      const offset = distanceBetween(
        osmAddr.lat,
        osmAddr.lng,
        linzAddr.lat,
        linzAddr.lng,
      );
      // mutating assign is cheaper than spread
      return Object.assign(osmAddr, {
        offset,
        confidence:
          offset < 200 ? Confidence.NORMAL : Confidence.UNLIKELY_GUESS, // we have more confidence if the osm node is closer than 200m to the gazetted location
      });
    })
    .sort((a, b) => a.offset - b.offset);

  if (almostPerfect.length) {
    // marginally faster than [...spread]
    return Array.prototype.concat.apply(
      perfectMatches.map(withC(Confidence.HIGH_BUT_MULTIPLE)),
      almostPerfect,
    );
  }

  // we're not confident enough about any of the possible addresses, so return nothing. or perfect matches if there are 2+
  return perfectMatches.map(withC(Confidence.HIGH_BUT_MULTIPLE));
};
