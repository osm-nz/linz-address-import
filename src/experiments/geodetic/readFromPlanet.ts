import { join } from 'path';
import pbf2json, { Item } from 'pbf2json';
import through from 'through2';
import { OsmId } from '../../types';
import { OsmMarker } from './const';

/** checks if an ISO date exists and if it it's less than 1 year old */
const isChecked = (v: string | undefined) =>
  !!v && (+new Date() - +new Date(v)) / 1000 / 60 / 60 / 24 < 365;

export async function readFromPlanet(): Promise<Record<string, OsmMarker>> {
  return new Promise((resolve, reject) => {
    console.log('Extracting markers from OSM Planet...');
    const out: Record<string, OsmMarker> = {};
    let i = 0;

    const planetFile = join(__dirname, '../../../data/osm.pbf');

    pbf2json
      .createReadStream({
        file: planetFile,
        tags: ['man_made~survey_point+ref'],
        leveldb: '/tmp',
      })
      .pipe(
        through.obj((item: Item, _e, next) => {
          i += 1;
          if (!(i % 100)) process.stdout.write('.');

          if (item.type !== 'node') {
            console.warn('\t(!) skipping a non-node');
            next();
            return;
          }

          const obj: OsmMarker = {
            osmId: ('n' + item.id) as OsmId,
            lat: +item.lat,
            lng: +item.lon,
            name: item.tags.name,
            description: item.tags.description
              ?.replace(/\s\s+/g, ' ')
              .trim()
              .slice(0, 255),
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
            checked: isChecked(item.tags.check_date),
          };

          const website = `https://www.geodesy.linz.govt.nz/gdb?code=${item.tags.ref}`;

          if (item.tags.operator !== 'Land Information New Zealand') {
            obj.needsOperatorTag = true;
          }
          if (item.tags.website !== website) {
            obj.needsWebsiteTag = true;
          }

          out[item.tags.ref!] = obj;

          next();
        }),
      )
      .on('finish', () => {
        console.log(`Read ${Object.keys(out).length} markers from OSM`);
        resolve(out);
      })
      .on('error', reject);
  });
}
