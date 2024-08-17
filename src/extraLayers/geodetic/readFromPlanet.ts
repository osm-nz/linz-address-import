import { join } from 'node:path';
import pbf2json, { type Item } from 'pbf2json';
import through from 'through2';
import { isChecked, withinBBox } from '../../common/index.js';
import type { BBox, OsmId } from '../../types.js';
import type { OsmMarker } from './const.js';

export async function readFromPlanet(
  bbox: BBox,
): Promise<Record<string, OsmMarker>> {
  return new Promise((resolve, reject) => {
    console.log('Extracting markers from OSM Planet...');
    const out: Record<string, OsmMarker> = {};
    let index = 0;
    let skipped = 0;
    const duplicates: Record<string, OsmId[]> = {};

    const planetFile = join(import.meta.dirname, '../../../data/osm.pbf');

    pbf2json
      .createReadStream({
        file: planetFile,
        tags: ['man_made~survey_point+ref'],
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _, next) => {
          index += 1;
          if (!(index % 100)) process.stdout.write('.');

          if (item.type !== 'node') {
            console.warn('\t(!) skipping a non-node');
            next();
            return;
          }

          if (!withinBBox(bbox, +item.lat, +item.lon)) {
            skipped += 1;
            next();
            return;
          }

          const ref = item.tags.ref!;

          const object: OsmMarker = {
            osmId: <OsmId>`n${item.id}`,
            lat: +item.lat,
            lng: +item.lon,
            name: item.tags.name,
            description: item.tags.description
              ?.replace(/\s\s+/g, ' ')
              .slice(0, 255)
              .trim(),
            ele: item.tags.ele,
            height: item.tags.height,
            material: item.tags.material,
            'survey_point:purpose': item.tags['survey_point:purpose'] as
              | 'both'
              | 'horizontal',
            'survey_point:datum_aligned': item.tags[
              'survey_point:datum_aligned'
            ] as 'yes' | 'no' | undefined,
            'survey_point:structure': item.tags['survey_point:structure'],
            checked: !!isChecked(item.tags.check_date),
          };

          const website = `https://www.geodesy.linz.govt.nz/gdb?code=${ref}`;

          if (item.tags.operator !== 'Land Information New Zealand') {
            object.needsOperatorTag = true;
          }
          if (item.tags.website !== website) {
            object.needsWebsiteTag = true;
          }

          if (ref in out) {
            if (duplicates[ref]) {
              duplicates[ref].push(object.osmId);
            } else {
              duplicates[ref] = [out[ref].osmId, object.osmId];
            }
          }

          out[ref] = object;

          next();
        }),
      )
      .on('finish', () => {
        console.log(
          `Read ${
            Object.keys(out).length
          } markers from OSM, skipped ${skipped}`,
        );

        if (Object.keys(duplicates).length) {
          console.log(
            '\n\nCAUTION: RESULT IS UNSTABLE DUE TO DUPLICATE REFS',
            duplicates,
            '\n\n',
          );
        }

        resolve(out);
      })
      .on('error', reject);
  });
}
