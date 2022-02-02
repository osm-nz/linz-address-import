import {
  getFeatures,
  OsmFeature,
  OsmFeatureType,
  OsmNode,
  OsmRelation,
  OsmWay,
} from 'osm-api';
import { chunk } from '../../common';
import { HandlerReturnWithBBox, OsmId } from '../../types';
import { MAP } from '../util';

type Cache = {
  node: { [id: number]: OsmNode };
  way: { [id: number]: OsmWay };
  relation: { [id: number]: OsmRelation };
};

let cache: Cache | null = null;

/**
 * The pbf2json library doesn't tell us the members of a relation, or
 * the nodes of a way. If we want to edit the tags of an feature using
 * a osmChange file, we need to know this this information.
 */
export async function fetchOriginalFeatures(
  datasets: HandlerReturnWithBBox,
): Promise<void> {
  const toEdit: {
    node: number[];
    way: number[];
    relation: number[];
  } = { node: [], way: [], relation: [] };

  for (const dsId in datasets) {
    const { features } = datasets[dsId];
    for (const f of features) {
      if (f.id.startsWith('SPECIAL_EDIT')) {
        // eslint-disable-next-line no-underscore-dangle
        const osmId = f.properties.__osmId as OsmId;
        const type = MAP[osmId[0] as 'n' | 'w' | 'r'];
        toEdit[type].push(+osmId.slice(1));
      }
    }
  }

  const fetched: Cache = {
    node: {},
    way: {},
    relation: {},
  };

  for (const $type in toEdit) {
    const type = $type as OsmFeatureType; // TS is dumb

    // the OSM API can cope with 600ish at a time
    const chunks = chunk(toEdit[type], 500);

    for (const [i, chonk] of chunks.entries()) {
      console.log(`\tFetching ${type}s (${i + 1}/${chunks.length})...`);
      const result = await getFeatures(type, chonk);
      for (const feature of result) {
        fetched[type][feature.id] = feature;
      }
    }
  }

  cache = fetched;
}

export function amendOsmChangeFeature(
  type: OsmFeatureType,
  id: number,
  /** tags to add or remove. If the value is the 🗑️ emoji */
  tagPatch: Record<string, string | undefined>,
): OsmFeature {
  if (!cache) throw new Error("Original data hasn't loaded");

  const feat = cache[type]?.[id];

  if (!feat) throw new Error(`${type} ${id} wasn't fetched from the API`);

  feat.tags = { ...feat.tags, ...tagPatch } as Record<string, string>;

  for (const key in feat.tags) {
    const value = feat.tags[key];
    if (!value || value === '🗑️') delete feat.tags[key];
  }

  return feat;
}
