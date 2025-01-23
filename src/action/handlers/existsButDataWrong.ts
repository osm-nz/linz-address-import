import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  CheckDate,
  type GeoJsonFeature,
  type HandlerReturn,
  type Issue,
  type OsmAddr,
  type Status,
  type StatusReport,
} from '../../types.js';
import {
  createDiamond,
  fieldsToModify,
  outFolder,
  toLink,
} from '../util/index.js';

const toKey = (right: string, wrong: string, osmData: OsmAddr) =>
  `${[right, wrong].sort().join('__')}__${osmData.street}`;

const SPECIAL_REVIEW = 'Recently Edited Addresses';

export async function existsButDataWrong(
  array: StatusReport[Status.EXISTS_BUT_WRONG_DATA],
): Promise<HandlerReturn> {
  const bySuburb = array.reduce(
    (ac, [linzId, [osmAddr, _suburb, needsSpecialReview, ...issues]]) => {
      const suburb = needsSpecialReview ? SPECIAL_REVIEW : _suburb;
      ac[suburb] ||= [];
      ac[suburb].push([linzId, osmAddr, issues]);
      return ac;
    },
    {} as Record<
      string,
      [linzId: string, osmAddr: OsmAddr, issues: Issue[], swap?: boolean][]
    >,
  );

  let report = '';
  const out: HandlerReturn = {};

  for (const suburb in bySuburb) {
    report += `\n${suburb}\n`;

    const features: GeoJsonFeature[] = [];

    // search for pairs where the housenumber was simply swapped
    // this is a common occurance, e.g. someone swaps 14A and 14B
    // but doesn't change the linzref
    const maybeSwappablePairs: Record<
      string,
      { index: number; linzId: string; osmData: OsmAddr }[]
    > = {};
    for (let index = 0; index < bySuburb[suburb].length; index += 1) {
      const [linzId, osmData, issues] = bySuburb[suburb][index];

      const [type, right, wrong] = issues[0].split('|');
      if (issues.length === 1 && type === 'housenumber') {
        const key = toKey(right, wrong, osmData);
        maybeSwappablePairs[key] ||= [];
        maybeSwappablePairs[key].push({ index, linzId, osmData });
      }
    }

    for (const key in maybeSwappablePairs) {
      const swappable = maybeSwappablePairs[key];
      if (swappable.length === 2) {
        const [a, b] = swappable;

        features.push({
          type: 'Feature',
          id: a.osmData.osmId,
          geometry: {
            type: 'Polygon',
            coordinates: createDiamond(a.osmData),
          },
          properties: {
            __action: 'edit',
            // instead of changing the housenumber, we will swap the linz ref
            'ref:linz:address_id': b.linzId,

            // maybe remove the check_date tag if it's out-of-date
            ...(a.osmData.checked === CheckDate.YesExpired && {
              check_date: '🗑️',
            }),
          },
        });

        // eslint-disable-next-line unicorn/no-array-push-push -- to avoid destroying the git blame
        features.push({
          type: 'Feature',
          id: b.osmData.osmId,
          geometry: {
            type: 'Polygon',
            coordinates: createDiamond(b.osmData),
          },
          properties: {
            __action: 'edit',
            // instead of changing the housenumber, we will swap the linz ref
            'ref:linz:address_id': a.linzId,

            // maybe remove the check_date tag if it's out-of-date
            ...(b.osmData.checked === CheckDate.YesExpired && {
              check_date: '🗑️',
            }),
          },
        });

        // tell the next loop that these ones have already been handled
        bySuburb[suburb][a.index][3] = true;
        bySuburb[suburb][b.index][3] = true;
      }
    }

    for (const [linzId, osmData, issues, swap] of bySuburb[suburb]) {
      report += `${linzId}\t\t${toLink(osmData.osmId)}\t\t${
        swap ? '(swap) ' : ''
      }${issues.join('\tand\t')}\n`;

      // we'll deal with this one later
      if (swap) continue;

      features.push({
        type: 'Feature',
        id: osmData.osmId,
        geometry: {
          type: 'Polygon',
          coordinates: createDiamond(osmData),
        },
        properties: {
          __action: 'edit',
          ...fieldsToModify(issues),
          // maybe remove the check_date tag if it's out-of-date
          ...(osmData.checked === CheckDate.YesExpired && { check_date: '🗑️' }),
        },
      });
    }

    const layerName =
      suburb === SPECIAL_REVIEW ? suburb : `Address Update - ${suburb}`;
    out[layerName] = features;
  }

  await fs.writeFile(join(outFolder, 'data-wrong.txt'), report);

  return out;
}
