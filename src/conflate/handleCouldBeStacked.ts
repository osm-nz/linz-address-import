import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { OsmId } from '@osm-conflation-engine/cli';
import type { OsmFeatureType } from 'osm-api';
import { toStackId } from '../common/index.js';
import type { CouldStackData } from '../types.js';
import { outFolder } from './helpers/index.js';

const MAP: Record<string, OsmFeatureType> = {
  n: 'node',
  w: 'way',
  r: 'relation',
};

const osmIdToLink = (id: OsmId) =>
  `[${id}](https://osm.org/${MAP[id[0]]}/${id.slice(1)})`;

type BySuburb = {
  [suburb: string]: {
    [addr: string]: {
      meta: string | number;
      osmIds: OsmId[];
      linzIds: string[];
    };
  };
};

export async function handleCouldBeStacked(
  couldBeStacked: CouldStackData,
): Promise<void> {
  let report = '';

  const bySuburb = Object.entries(couldBeStacked).reduce(
    (_ac, [linzId, [osmId, suburb, addr, meta]]) => {
      const ac = _ac;
      ac[suburb] ||= {};
      ac[suburb][addr] ||= { meta, osmIds: [], linzIds: [] };
      ac[suburb][addr].osmIds.push(osmId);
      ac[suburb][addr].linzIds.push(linzId);
      return ac;
    },
    {} as BySuburb,
  );

  for (const suburb in bySuburb) {
    report += `### ${suburb}\n\n`;
    for (const addr in bySuburb[suburb]) {
      const { meta, osmIds, linzIds } = bySuburb[suburb][addr];

      report += `- ${meta} flats at _${addr}_ could be stacked instead of ${osmIds
        .map(osmIdToLink)
        .join(',')} → \`${toStackId(linzIds)}\`\n`;
    }
  }

  await fs.mkdir(outFolder, { recursive: true });
  await fs.writeFile(join(outFolder, 'could-be-stacked.md'), report);
}
