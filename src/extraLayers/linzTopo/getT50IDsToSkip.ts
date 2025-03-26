import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import pbf2json, { type Item } from 'pbf2json';
import through from 'through2';
import { fetchIgnoreList } from '../../common/index.js';
import type { IgnoreFile } from '../../preprocess/const.js';

const PATH = join(import.meta.dirname, '../../../data/t50ids.json');

async function readFromPlanet(
  mutableOut: IgnoreFile,
  fileName: string,
  includeNautical: boolean,
) {
  console.log(
    `Extracting ref:linz:topo50_ids from the OSM Planet (${fileName})...`,
  );
  await new Promise<void>((resolve, reject) => {
    let index = 0;

    const planetFile = join(import.meta.dirname, `../../../data/${fileName}`);

    pbf2json
      .createReadStream({
        file: planetFile,
        tags: [
          includeNautical
            ? 'ref:linz:topo50_id,ref:linz:hydrographic_id'
            : 'ref:linz:topo50_id',
        ],
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _, next) => {
          index += 1;
          if (!(index % 1000)) process.stdout.write('.');

          // a feature could have both a topo ID & a hydro ID
          const t = item.tags['ref:linz:topo50_id'];
          const h = item.tags['ref:linz:hydrographic_id'];
          const n = item.tags['ref:linz:napalis_id'];

          if (t) {
            for (const ref of t.split(';')) {
              mutableOut[`t${ref}`] = 1;
            }
          }
          if (h) {
            for (const ref of h.split(';')) {
              mutableOut[`h${ref}`] = 1;
            }
          }
          if (n) {
            for (const ref of n.split(';')) {
              mutableOut[`t${ref}`] = 1;
            }
          }

          next();
        }),
      )
      .on('finish', () => {
        console.log(`Read ${index} IDs from OSM`);
        resolve();
      })
      .on('error', reject);
  });
}

/**
 * fetches every ref:linz:topo50_id tag from the OSM planet
 * Eventually this method will be too inefficient
 */
export async function getT50IDsToSkip(
  includeNautical: boolean,
): Promise<IgnoreFile> {
  if (process.argv.includes('--quick')) {
    console.log('Using potentially out-of-date version of t50ids.json');
    return JSON.parse(await fs.readFile(PATH, 'utf8'));
  }

  console.log('Fetching ref:linz:topo50_ids to skip...');
  const out: IgnoreFile = await fetchIgnoreList(1908575024, 'LINZ Topo50 ID');

  await readFromPlanet(out, 'osm.pbf', includeNautical);

  if (includeNautical) {
    await readFromPlanet(out, 'ross-dep-to-mainland.osm.pbf', true);
    await readFromPlanet(out, 'north-of-mainland.osm.pbf', true);
    await readFromPlanet(out, 'polynesia.osm.pbf', true);
  }

  await fs.writeFile(PATH, JSON.stringify(out));

  return out;
}
