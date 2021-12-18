import {
  Changeset,
  getFeatures,
  OsmChange,
  OsmFeature,
  OsmFeatureType,
} from 'osm-api';
import { chunk } from '../common';

type IDObj = Record<OsmFeatureType, `${number}v${number}`[]>;

export type CSWithDiff = { cs: Changeset; diff: OsmChange };

/**
 * the osmChange doesn't have the last known tags for deleted features,
 * so we need to call another API to fetch them...
 *
 * This function patches the supplied osmChange, so that the returned version
 * has tags for deleted features.
 */
export async function patchOsmChange(
  diffs: CSWithDiff[],
): Promise<CSWithDiff[]> {
  const toFetch = diffs
    .flatMap((d) => d.diff.delete)
    .reduce<IDObj>(
      (ac, f) => {
        return { ...ac, [f.type]: [...ac[f.type], `${f.id}v${f.version - 1}`] };
      },
      { node: [], way: [], relation: [] },
    );

  const withTags: Record<OsmFeatureType, Record<number, OsmFeature>> = {
    node: {},
    way: {},
    relation: {},
  };

  for (const $type in toFetch) {
    const type = $type as OsmFeatureType; // TS is dumb

    // the OSM API can cope with 600ish at a time
    const chunks = chunk(toFetch[type], 500);

    for (const [i, chonk] of chunks.entries()) {
      console.log(`\tFetching ${type}s (${i + 1}/${chunks.length})...`);
      const result = await getFeatures(type, chonk);
      for (const feature of result) {
        withTags[type][feature.id] = feature;
      }
    }
  }

  // now patch the osmChange files
  const newList = diffs.map(({ cs, diff }) => ({
    cs,
    diff: {
      ...diff,
      delete: diff.delete.map((feat) => withTags[feat.type][feat.id]),
    },
  }));

  return newList;
}
