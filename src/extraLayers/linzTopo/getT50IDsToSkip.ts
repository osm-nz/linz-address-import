import { promises as fs } from 'fs';
import { join } from 'path';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { IgnoreFile } from '../../preprocess/const';
import { fetchIgnoreList } from '../../preprocess/fetchIgnoreList';

/**
 * fetches every ref:linz:topo50_id tag from the OSM planet
 * Eventually this method will be too inefficient
 */
export async function getT50IDsToSkip(): Promise<IgnoreFile> {
  console.log('Fetching ref:linz:topo50_ids to skip...');
  const out: IgnoreFile = await fetchIgnoreList(1908575024, 'LINZ Topo50 ID');

  console.log('Extracting ref:linz:topo50_ids from the OSM Planet...');
  await new Promise<void>((resolve, reject) => {
    let i = 0;

    const planetFile = join(__dirname, '../../../data/osm.pbf');

    pbf2json
      .createReadStream({
        file: planetFile,
        tags: ['ref:linz:topo50_id'],
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _e, next) => {
          i += 1;
          if (!(i % 1000)) process.stdout.write('.');

          const ref = item.tags['ref:linz:topo50_id']!;
          out[ref] = 1;
          next();
        }),
      )
      .on('finish', () => {
        console.log(`Read ${i} IDs from OSM`);
        resolve();
      })
      .on('error', reject);
  });

  await fs.writeFile(
    join(__dirname, '../../../data/t50ids.json'),
    JSON.stringify(out),
  );

  return out;
}
