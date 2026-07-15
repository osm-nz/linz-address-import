import type { DatasetId, OsmFeature, OsmId } from '@osm-conflation-engine/cli';
import type { OsmPatchFeature } from 'osm-api';
import { type CallbackFunctions, type LinzAddr, Status } from '../types.js';
import { REF_TAG } from '../config.js';
import { addToReport } from './report.js';
import { toLink } from './helpers/const.js';

export const SPECIAL_REVIEW = 'Recently Edited Addresses';
export const SPECIAL_REVIEW_INFO = `
  These addresses were recently edited by a non-importer. The suggestions
  from the import tool may be wrong; so this layer is the most time consuming,
  the history of every feature needs to be carefully checked. If someone has
  manually edited ref:linz:address_id, the best solution may be to delete
  the mismatched ref tags, and wait for the next time that the import /
  conflation system runs.
`
  .replaceAll('\n', '')
  .replaceAll(/ +/g, ' ')
  .trim();

const toKey = (right: string, wrong: string, linzAddr: LinzAddr) =>
  `${[right, wrong].toSorted().join('__')}__${linzAddr.street}`;

export const postprocessLayer: CallbackFunctions['postprocessLayer'] & {} = ({
  group,
  osmData,
  sourceData,
  features,
}) => {
  // search for pairs where the housenumber was simply swapped
  // this is a common occurance, e.g. someone swaps 14A and 14B
  // but doesn't change the linzref

  const maybeSwappablePairs: Record<
    string,
    { diff: OsmPatchFeature; osmFeature: OsmFeature; linzId: DatasetId }[]
  > = {};
  for (const diff of features) {
    const osmFeature = osmData[<OsmId>diff.id];
    const finalRef = <DatasetId>(
      (diff.properties[REF_TAG] || osmFeature?.tags[REF_TAG])
    );
    const linzAddr = sourceData[finalRef]?.properties;

    if (!linzAddr || !osmFeature) continue;

    const isDiffPurelyHouseNumber = Object.keys(diff.properties).every(
      (key) => key === '__action' || key === 'addr:housenumber',
    );
    if (!isDiffPurelyHouseNumber) continue;

    const right = linzAddr.housenumber;
    const wrong = osmFeature.tags['addr:housenumber'];

    const key = toKey(right, wrong, linzAddr);
    maybeSwappablePairs[key] ||= [];
    maybeSwappablePairs[key].push({
      diff,
      osmFeature,
      linzId: linzAddr.id,
    });
  }

  for (const key in maybeSwappablePairs) {
    const swappable = maybeSwappablePairs[key];
    if (swappable.length === 2) {
      const [a, b] = swappable;

      features.splice(features.indexOf(a.diff), 1);
      features.push({
        type: 'Feature',
        id: a.osmFeature.id,
        geometry: a.diff.geometry,
        properties: {
          __action: 'edit',
          // instead of changing the housenumber, we will swap the linz ref
          'ref:linz:address_id': b.linzId,
        },
      });

      features.splice(features.indexOf(b.diff), 1);
      features.push({
        type: 'Feature',
        id: b.osmFeature.id,
        geometry: b.diff.geometry,
        properties: {
          __action: 'edit',
          // instead of changing the housenumber, we will swap the linz ref
          'ref:linz:address_id': a.linzId,
        },
      });

      // this creates a duplicate entry, but nevermind
      addToReport(
        Status.EXISTS_BUT_WRONG_DATA,
        group,
        `${a.linzId} <-> ${b.linzId}\t\tneed to be swapped\t\t${toLink(a.osmFeature.id)} <-> ${toLink(b.osmFeature.id)}`,
      );
    } else {
      delete maybeSwappablePairs[key];
    }
  }

  return features;
};
