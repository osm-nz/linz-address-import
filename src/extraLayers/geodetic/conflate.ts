import { promises as fs } from 'fs';
import { join } from 'path';
import { HandlerReturn, GeoJsonFeature } from '../../types';
import { distanceBetween } from '../../conflate/helpers/geo';
import { createDiamond } from '../../action/util';
import { LINZMarker, OsmMarker } from './const';

type MutalTags = keyof (LINZMarker | OsmMarker);

/** only include this tag if it's currently missing or wrong */
const includeIfWrong = (
  linzMarker: LINZMarker | undefined,
  osmMarker: OsmMarker | undefined,
  key: MutalTags,
) => {
  if (osmMarker?.[key] && linzMarker && !linzMarker[key]) {
    return { [key]: '🗑️' };
  }

  if (!osmMarker?.[key] || linzMarker?.[key] !== osmMarker[key]) {
    return { [key]: linzMarker?.[key] };
  }
  return {};
};

/**
 * @param linzMarker will be undefined if deleting this marker
 * @param osmMarker will be undefined if creating this marker
 */
const tagging = (
  code: string,
  linzMarker: LINZMarker | undefined,
  osmMarker: OsmMarker | undefined,
): Record<string, string | undefined> => ({
  man_made: 'survey_point',
  ref: code,

  ...includeIfWrong(linzMarker, osmMarker, 'name'),
  ...includeIfWrong(linzMarker, osmMarker, 'description'),
  // ...includeIfWrong(linzMarker, osmMarker, 'ele'),
  ...(!osmMarker && { ele: linzMarker?.ele }), // only add the ele tag if creating a node. don't touch it for edits
  ...includeIfWrong(linzMarker, osmMarker, 'material'),
  ...includeIfWrong(linzMarker, osmMarker, 'height'),

  ...includeIfWrong(linzMarker, osmMarker, 'survey_point:datum_aligned'),
  ...includeIfWrong(linzMarker, osmMarker, 'survey_point:purpose'),
  ...includeIfWrong(linzMarker, osmMarker, 'survey_point:structure'),

  ...((!osmMarker || osmMarker.needsOperatorTag) && {
    operator: 'Land Information New Zealand',
  }),
  ...((!osmMarker || osmMarker.needsWebsiteTag) &&
    linzMarker && {
      website: `https://www.geodesy.linz.govt.nz/gdb?code=${code.replace(
        'SPECIAL_EDIT_',
        '',
      )}`,
    }),
});

export async function conflate(
  linz: Record<string, LINZMarker>,
  _osm: Record<string, OsmMarker>,
): Promise<void> {
  const osm = _osm;
  console.log('Conflating survey markers...');

  const add: GeoJsonFeature[] = [];
  const move: GeoJsonFeature[] = [];
  const edit: GeoJsonFeature[] = [];
  // remove defined below

  for (const code in linz) {
    const linzMarker = linz[code];
    const osmMarker = osm[code];

    if (osmMarker) {
      // already exists in OSM

      if (osmMarker.checked) {
        // skip if recent check_date
        delete osm[code];
        continue; // eslint-disable-line no-continue
      }

      const anyTagsWrong = (<MutalTags[]>[
        'name',
        // 'ele', // don't touch the ele tag because there are various issues that need solving
        'description',
        'datumAligned',
        'height',
        'material',
        'structure',
      ]).some((tag) => linzMarker[tag] !== osmMarker[tag]);

      const distanceApart = distanceBetween(
        linzMarker.lat,
        linzMarker.lng,
        osmMarker.lat,
        osmMarker.lng,
      );
      if (distanceApart > 1 /* metres */) {
        // we are really picky about this
        move.push({
          type: 'Feature',
          id: `LOCATION_WRONG_SPECIAL_${code}`,
          geometry: {
            type: 'LineString',
            coordinates: [
              [osmMarker.lng, osmMarker.lat], // from
              [linzMarker.lng, linzMarker.lat], // to
            ],
          },
          properties: { ref: `LOCATION_WRONG_SPECIAL_${code}` }, // all other tags will be ignored anyway
        });
      } else if (anyTagsWrong) {
        edit.push({
          type: 'Feature',
          id: `SPECIAL_EDIT_${code}`,
          geometry: { type: 'Polygon', coordinates: createDiamond(osmMarker) },
          properties: tagging(`SPECIAL_EDIT_${code}`, linzMarker, osmMarker),
        });
      } else {
        // exists in OSM, tags are perfect, location perfect. Nothing to do
      }
    } else {
      // does not exist in OSM
      add.push({
        type: 'Feature',
        id: code,
        geometry: {
          type: 'Point',
          coordinates: [linzMarker.lng, linzMarker.lat],
        },
        properties: tagging(code, linzMarker, undefined),
      });
    }

    // delete visited stops in OSM
    delete osm[code];
  }

  const remove: GeoJsonFeature[] = Object.entries(osm).map(
    ([code, osmMarker]) => {
      return {
        type: 'Feature',
        id: `SPECIAL_DELETE_${code}`,
        geometry: {
          type: 'Point',
          coordinates: [osmMarker.lng, osmMarker.lat],
        },
        properties: tagging(`SPECIAL_DELETE_${code}`, undefined, osmMarker),
      };
    },
  );

  const out: HandlerReturn = {
    'ZZ Survey Markers - Add': add,
    'ZZ Survey Markers - Move': move,
    'ZZ Survey Markers - Edit': edit,
    'ZZ Survey Markers Delete': remove,
  };

  await fs.writeFile(
    join(__dirname, `../../../data/extra-layers.geo.json`),
    JSON.stringify(out),
  );
}
