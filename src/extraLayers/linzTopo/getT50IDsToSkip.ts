import { promises as fs } from 'fs';
import { join } from 'path';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { IgnoreFile } from '../../preprocess/const';
import { fetchIgnoreList } from '../../preprocess/fetchIgnoreList';

const PATH = join(__dirname, '../../../data/t50ids.json');

async function readFromPlanet(mutableOut: IgnoreFile, fileName: string) {
  console.log(
    `Extracting ref:linz:topo50_ids from the OSM Planet (${fileName})...`,
  );
  await new Promise<void>((resolve, reject) => {
    let i = 0;

    const planetFile = join(__dirname, `../../../data/${fileName}`);

    pbf2json
      .createReadStream({
        file: planetFile,
        tags: ['ref:linz:topo50_id,ref:linz:hydrographic_id'],
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _e, next) => {
          i += 1;
          if (!(i % 1000)) process.stdout.write('.');

          const type = item.tags['ref:linz:topo50_id'] ? 't' : 'h';

          // TODO: remove hydrographic ID once the maritime import is complete
          const refs = (item.tags['ref:linz:topo50_id'] ||
            item.tags['ref:linz:hydrographic_id'])!.split(';');

          for (const ref of refs) {
            // eslint-disable-next-line no-param-reassign -- we are deliberately mutating it
            mutableOut[type + ref] = 1;
          }

          next();
        }),
      )
      .on('finish', () => {
        console.log(`Read ${i} IDs from OSM`);
        resolve();
      })
      .on('error', reject);
  });
}

/**
 * fetches every ref:linz:topo50_id tag from the OSM planet
 * Eventually this method will be too inefficient
 */
export async function getT50IDsToSkip(): Promise<IgnoreFile> {
  if (process.argv.includes('--quick')) {
    console.log('Using potentially out-of-date version of t50ids.json');
    return JSON.parse(await fs.readFile(PATH, 'utf8'));
  }

  console.log('Fetching ref:linz:topo50_ids to skip...');
  const out: IgnoreFile = await fetchIgnoreList(1908575024, 'LINZ Topo50 ID');

  await readFromPlanet(out, 'osm.pbf');
  await readFromPlanet(out, 'ross-dep-to-mainland.osm.pbf');
  await readFromPlanet(out, 'north-of-mainland.osm.pbf');
  await readFromPlanet(out, 'polynesia.osm.pbf');

  await fs.writeFile(PATH, JSON.stringify(out));

  return out;
}
