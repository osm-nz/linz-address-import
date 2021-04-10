import { OsmId } from '../../types';

export const MAP = { node: 'n', way: 'w', relation: 'r' };

/**
 * `false` if this type should not be added to OSM
 * otherwise an array for the values of
 * [
 *  survey_point:structure,
 *  height,
 *  material
 * ]
 *
 * use `undefined` to omit that tag
 */
export const beaconTypes = <const>{
  'Two metre beacon': ['beacon', '2'],
  '2 metre wooden beacon': ['beacon', '2', 'wood'],
  '3 or 4 metre metal beacon': ['beacon', '3-4', 'metal'],
  '3 or 4 metre wooden beacon': ['beacon', '3-4', 'wood'],
  'Four metre beacon': ['beacon', '4'],
  Tripod: ['beacon'],
  'Two metre metal beacon': ['beacon', '2', 'metal'],
  'Non Standard Beacon': ['beacon'],
  'Deep Drilled Braced Monument': ['beacon'],
  'Shallow Drilled Braced Monument': ['beacon'],

  Pillar: ['pillar'],
  Post: ['pole'],
  Mast: ['pole'],
  Cairn: ['cairn'],

  Chimney: false, // don't map, since there's no survey marker structure, it's just a well known point
  Lighthouse: false, // as above
  'Television Tower': false, // as above
  Tower: false, // as above
  'Marine Beacon': false, // as above. these are all lights. should be mapped as something else
  'Not Beaconed': false, // don't map, just a pin/plaque etc. Too many of them in NZ to map (131k)
  Unknown: false,
  '': false,
};

/**
 * `false` if marks in this condition should not be added to OSM
 * otherwise, it is the value of `survey_point:datum_aligned`.
 * Empty string to leave out the `survey_point:datum_aligned` field
 */
export const markConditions = <const>{
  'Reliably Placed/Found': 'yes',

  Dangerous: '',
  'Mark Found': '',
  'Not Specified': '',
  Threatened: '',
  '': '',

  Damaged: 'no',
  Moved: 'no',
  Unstable: 'no',

  Destroyed: false,
  'Not Accessibe': false,
  Removed: false,

  Emplaced: false, // not clear what this means so don't map
  'Not Found': false,
  'Not Accessible': false,
  Submerged: false,
};

export type LINZCSVItem = {
  /** @deprecated */ WKT: string;
  /** @deprecated */ id: number;
  geodetic_code: number;
  current_mark_name?: string;
  description: string;
  /** @deprecated */ mark_type: string;
  beacon_type: keyof typeof beaconTypes;
  mark_condition: keyof typeof markConditions;
  /** @deprecated */ order: number;
  /** @deprecated */ land_district: string;
  latitude: string;
  longitude: string;
  ellipsoidal_height: string;
  /** @deprecated */ shape_X: string;
  /** @deprecated */ shape_Y: string;
};

export type LINZMarker = {
  // code: string; // not included since it would duplicate the object key
  lat: number;
  lng: number;
  name: string | undefined;
  description: string | undefined;
  /** work with strings to avoid loss of precision */
  ele?: string;
  ['survey_point:structure']: string;
  ['survey_point:purpose']: 'both' | 'horizontal' | 'vertical';
  // optional tags
  ['survey_point:datum_aligned']: 'yes' | 'no' | undefined;
  height: string | undefined;
  material: string | undefined;
};

export type OsmMarker = {
  osmId: OsmId;
  // code: string; // not included since it would duplicate the object key
  lat: number;
  lng: number;

  name?: string;
  description?: string;
  /** work with strings to avoid loss of precision */
  ele?: string;
  ['survey_point:structure']?: string;
  ['survey_point:datum_aligned']?: 'yes' | 'no';
  ['survey_point:purpose']?: 'both' | 'horizontal';
  height?: string;
  material?: string;

  needsOperatorTag?: true;
  needsWebsiteTag?: true;

  /** whether the marker has a recent check_date */
  checked: boolean;
};
