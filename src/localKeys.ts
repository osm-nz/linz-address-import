import type { OsmFeature } from '@osm-conflation-engine/cli';
import type { LinzSourceFeature } from './types.js';

const RS = '\u001F';

export function getLocalKeyForOsm(osmAddr: OsmFeature) {
  return osmAddr.tags['addr:housenumber'] + RS + osmAddr.tags['addr:street'];
}

export function getLocalKeyForSource(linzAddr: LinzSourceFeature) {
  return linzAddr.properties.housenumber + RS + linzAddr.properties.street;
}
