import type {
  DatasetId as AddressId,
  Callbacks,
  OsmId,
  SourceDataFeature,
} from '@osm-conflation-engine/cli';
import type { Point } from 'geojson';

export type { DatasetId as AddressId } from '@osm-conflation-engine/cli';
export type { OsmPatchFeature as GeoJsonFeature } from 'osm-api';

export type CallbackFunctions = Callbacks<Point, LinzAddr>;

export type Coords = {
  lat: number;
  lng: number;
};

export type LinzAddr = Coords & {
  id: AddressId;
  housenumber: string;
  /** for alternate addresses, the other house number */
  housenumberAlt?: string;
  /** @deprecated don't use, for internal use in pre-process only */
  $houseNumberMsb?: string;
  street: string;
  suburb: string;
  town: string;
  /** whether this address is a water address */
  water?: true;
  /** for stacked addresse, this is the number of addresses in this stack */
  flatCount?: number;
  /**
   * whether this stack was generated purely because someone requested
   * it (using the tag `linz:stack=yes`)
   */
  isManualStackRequest?: true;
};
export type LinzData = {
  [linzId: AddressId]: LinzAddr;
};

export type AltAddrKeyPrefix = 'alt_addr' | `addr${number}`;

export type CouldStackData = {
  [linzId: AddressId]: [
    osmId: OsmId,
    suburb: string,
    readableAddr: string,
    meta: number | `${number}+${number}`,
  ];
};

export type LinzSourceFeature = SourceDataFeature<Point, LinzAddr>;

export type LinzSourceAddress = {
  type: 'Feature';
  properties?: {
    id: AddressId;
    hash: string;

    unit: string;
    number: string;
    street: string;
    /** called `suburb_locality` by LINZ.  e.g. `Shelly Park` */
    city: string;
    /** called `town_city` by LINZ. e.g. `Auckland`. The prescense of this field determines whether the OSM tag should be `addr:suburb` instead of `addr:hamlet` */
    district: string;
    region: '';
    postcode: '';
    accuracy: '';
    /** @deprecated current OpenAddresses does not passthrough this field */
    is_land?: 'F';
  };
  geometry: {
    type: 'Point';
    coordinates: [lon: number, lat: number];
  };
};

export enum Status {
  PERFECT = 1, // processWithRef
  EXISTS_BUT_WRONG_DATA = 2, // processWithRef
  EXISTS_BUT_NO_LINZ_REF = 3, // processWithoutRef
  MULTIPLE_EXIST_BUT_NO_LINZ_REF = 4, // processWithoutRef
  MULTIPLE_EXIST = 5, // processDuplicates
  EXISTS_BUT_LOCATION_WRONG = 6, // processWithRef
  TOTALLY_MISSING = 7, // processWithoutRef
  NEEDS_DELETE = 8,
  NEEDS_DELETE_NON_TRIVIAL = 9,
  CORRUPT = 10,
  LINZ_REF_CHANGED = 11,
  // 12 has been repealed since it's now obsolete. It was UNKNOWN_ERROR
  // 13 was just a report (FYI, not actionable), and is now generated during preprocessing. It was COULD_BE_STACKED
  NEEDS_DELETE_ON_BUILDING = 14,
  REPLACED_BY_BUILDING = 15,
}

export enum Confidence {
  /** after a lot of searching we found a similar address, but it's significantly far away */
  // UNLIKELY_GUESS = 1, // obsolete, we now ignore these rubbish guesses

  /** found a similar address nearby */
  NORMAL = 2,
  /** found multiple perfect matches */
  HIGH_BUT_MULTIPLE = 3,
  /** found one perfect match */
  CERTAIN = 4,
}

export type StatsFile = {
  total: number;
  count: Record<Status, number>;
  date: string;
  comment?: string;
};

export interface HistoryFile {
  lastUpdated: string;
  rows: StatsFile[];
}

export type CoordKey = `${number},${number}`;
/** a map of how many addresses at each coordinate in the LINZ dataset */
export type Overlapping = { [coordKey: CoordKey]: number };
