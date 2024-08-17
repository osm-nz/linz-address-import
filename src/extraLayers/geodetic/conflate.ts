import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { GeoJsonFeature, HandlerReturn } from '../../types.js';
import { distanceBetween } from '../../conflate/helpers/geo.js';
import { createDiamond } from '../../action/util/index.js';
import type { LINZMarker, OsmMarker } from './const.js';
import { checkStatus } from './checkStatus.js';

type MutalTags = keyof (LINZMarker | OsmMarker);

const MUTAL_TAGS: MutalTags[] = [
  'name',
  // 'ele', // don't touch the ele tag because there are various issues that need solving
  // 'survey_point:purpose', // as above
  'survey_point:datum_aligned',
  'survey_point:structure',
  'description',
  'height',
  'material',
];

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
 * @param code the 4 digit linz ref
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
      website: `https://www.geodesy.linz.govt.nz/gdb?code=${code}`,
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
        continue;
      }

      const anyTagsWrong = MUTAL_TAGS.some(
        (tag) => linzMarker[tag] !== osmMarker[tag],
      );

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
          id: osmMarker.osmId,
          geometry: {
            type: 'LineString',
            coordinates: [
              [osmMarker.lng, osmMarker.lat], // from
              [linzMarker.lng, linzMarker.lat], // to
            ],
          },
          properties: { __action: 'move' }, // all other tags will be ignored anyway
        });
      } else if (anyTagsWrong) {
        edit.push({
          type: 'Feature',
          id: osmMarker.osmId,
          geometry: { type: 'Polygon', coordinates: createDiamond(osmMarker) },
          properties: {
            __action: 'edit',
            ...tagging(code, linzMarker, osmMarker),
          },
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

  console.log('Procesing deletions...');
  const remove: GeoJsonFeature[] = [];
  const demote: GeoJsonFeature[] = [];
  for (const [code, osmMarker] of Object.entries(osm)) {
    if (osmMarker.checked) {
      // skip if recent check_date
      continue;
    }

    const out = await checkStatus(code);
    if (out.isDestroyed) {
      // LINZ has explicitly stated this marker is destroyed
      remove.push({
        type: 'Feature',
        id: osmMarker.osmId,
        geometry: {
          type: 'Point',
          coordinates: [osmMarker.lng, osmMarker.lat],
        },
        properties: {
          __action: 'delete',
          ...tagging(code, undefined, osmMarker),
        },
      });
    } else {
      // marker is NOT explicrtly marked as destroyed by LINZ
      // so we just downgrade the survey_point:structure tag

      const anyTagsWrong = MUTAL_TAGS.some(
        (tag) => out.linzMarker[tag] !== osmMarker[tag],
      );
      if (anyTagsWrong) {
        // some tags on this pin need changing
        demote.push({
          type: 'Feature',
          id: osmMarker.osmId,
          geometry: { type: 'Polygon', coordinates: createDiamond(osmMarker) },
          properties: {
            __action: 'edit',
            ...tagging(code, out.linzMarker, osmMarker),
          },
        });
      } else {
        // nothing to do: the pin is mapped fine
      }
    }
  }
  console.log('Finished procesing deletions');

  const out: HandlerReturn = {
    'ZZ Survey Markers - Add': add,
    'ZZ Survey Markers - Move': move,
    'ZZ Survey Markers - Edit': edit,
    'ZZ Survey Markers - Demote': demote,
    'ZZ Survey Markers - Delete': remove,
  };

  await fs.writeFile(
    join(__dirname, `../../../data/extra-layers.geo.json`),
    JSON.stringify(out),
  );
}
