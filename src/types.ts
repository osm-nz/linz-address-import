import type { OsmPatchFeature, Tags } from 'osm-api';

export type { OsmPatchFeature as GeoJsonFeature } from 'osm-api';

/** see microsoft/TypeScript#202 */
export type Identity<out T> = { _: T; readonly __: unique symbol };

export type OsmId = `${'n' | 'w' | 'r'}${string}`;
export type AddressId = string & Identity<'AddressId'>;

export type Coords = {
  lat: number;
  lng: number;
};

export type LinzAddr = Coords & {
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

export enum CheckDate {
  No,
  YesRecent, // check_date is recent (less than X years ago)
  YesExpired, // check_date is older than X years
}

export type AltAddrKeyPrefix = 'alt_addr' | `addr${number}`;

export type OsmAddr = Coords & {
  osmId: OsmId;
  housenumber?: string;
  /** for alternate addresses, a list of housenumber+street pairs */
  alts?: (Pick<OsmAddr, 'housenumber' | 'street'> & {
    /** the prefix where this tag-pair came from */
    sourceKeyPrefix: AltAddrKeyPrefix;
    /** the index where this tag-pair came from (if the value is semicolon-delimited) */
    sourceValueIndex: number;
  })[];
  street?: string;
  suburb?: string;
  town?: string;
  isNonTrivial: boolean;
  checked: CheckDate;
  /** whether this address is a water address */
  water?: true;
  /** whether this address has `addr:suburb` and `addr:hamlet` */
  doubleSuburb?: true;
  /** whether this address has `addr:hamlet` */
  hasHamlet?: true;
  /** whether this address is on a building AND has no linzRef */
  isUnRefedBuilding?: true;
  /** for stacked addresse, this is the number of addresses in this stack */
  flatCount?: number;
  /**
   * mappers can request that the system stacks or unstacks
   * certain addresses using the tag `linz:stack=yes/no`
   */
  stackRequest?: boolean;
  /** if the feature has been recently edited */
  recentlyChanged?: true;
  /** if the last user to edit this feature was an importer */
  lastEditedByImporter?: true;
  /** for manually-merged alternate addresses, the linzRef of the other addresses */
  altRef?: AddressId[];
};
export type OsmAddrWithConfidence = OsmAddr & {
  /** distance in metres away from expected location */
  offset?: number;
  confidence: Confidence;
}; // 4=highest, 1=lowest
export type OSMData = {
  linz: {
    [linzId: AddressId]: OsmAddr;
  };
  duplicateLinzIds: {
    [linzId: AddressId]: OsmAddr[];
  };
  /** if an OSM node has mutliple values for the linz ref, seperated by a semicolon */
  semi: {
    [linzId: AddressId]: OsmAddr;
  };
  noRef: OsmAddr[];
};

export type DeletionData = [linzId: AddressId, suburb: string][];

export type CouldStackData = {
  [linzId: AddressId]: [
    osmId: OsmId,
    suburb: string,
    readableAddr: string,
    meta: number | `${number}+${number}`,
  ];
};

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
  COULD_BE_STACKED = 13,
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

export type IssueType =
  | 'housenumber'
  | 'housenumberAlt'
  | 'street'
  | 'streetAlt'
  | 'suburb'
  | 'doubleSuburb'
  | 'town'
  | 'flatCount'
  | 'altRef'
  | 'water';
export type Issue = `${IssueType}|${string}|${string}`; // `field|linzValue|osmValue`;

export type StatusDiagnostics = {
  [Status.PERFECT]: never;
  [Status.EXISTS_BUT_WRONG_DATA]: [
    osmAddr: OsmAddr,
    Suburb: string,
    needsSpecialReview: boolean,
    ...issues: Issue[],
  ];
  [Status.EXISTS_BUT_NO_LINZ_REF]: [
    suburb: string,
    confidence: Confidence,
    osmData: OsmAddr,
  ];
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: [
    suburb: string,
    chosenOsmAddr: OsmAddr,
    allOsmIds: OsmId[],
  ];
  [Status.MULTIPLE_EXIST]: [linzAddr: LinzAddr, osmAddrs: OsmAddr[]];
  [Status.EXISTS_BUT_LOCATION_WRONG]: [
    suburb: string,
    metres: number,
    osmAddr: OsmAddr,
    linzLat: number,
    linzLng: number,
    osmLat: number,
    osmLng: number,
    isMinorMove: boolean,
  ];
  [Status.TOTALLY_MISSING]: LinzAddr;
  [Status.NEEDS_DELETE]: [suburb: string, osmData: OsmAddr];
  [Status.NEEDS_DELETE_NON_TRIVIAL]: [suburb: string, osmData: OsmAddr];
  [Status.CORRUPT]: [osm: OsmAddr, linz: LinzAddr];
  [Status.LINZ_REF_CHANGED]: [
    suburb: string,
    newLinzId: AddressId,
    osmData: OsmAddr,
    linzData: LinzAddr,
  ];
  [Status.COULD_BE_STACKED]: CouldStackData[AddressId];
  [Status.NEEDS_DELETE_ON_BUILDING]: [suburb: string, osmData: OsmAddr];
  [Status.REPLACED_BY_BUILDING]: [
    osmNode: OsmAddr,
    osmBuilding: OsmAddr,
    suburb: string,
  ];
};

export type StatusReport = {
  [S in Status]: [linzId: AddressId, diagnostics: StatusDiagnostics[S]][];
};

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

export type Coord = [lng: number, lat: number];

export type BBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type HandlerReturn = Record<string, OsmPatchFeature[]>;
export type HandlerReturnWithBBox = {
  [sectorName: string]: {
    features: OsmPatchFeature[];
    bbox: BBox;
    instructions?: string;
    changesetTags?: Tags;
  };
};

export namespace GH {
  export type IssueComment = { body: string };
}

export type ExtraLayers = {
  [layerId: string]: {
    instructions?: string;
    features: OsmPatchFeature[];
    changesetTags?: Tags;
  };
};

export type CoordKey = `${number},${number}`;
/** a map of how many addresses at each coordinate in the LINZ dataset */
export type Overlapping = { [coordKey: CoordKey]: number };
