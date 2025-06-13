/** see microsoft/TypeScript#202 */
export type Identity<out T> = { _: T; readonly __: unique symbol };

/** U=Urban (`addr:suburb`), R=Rural (`addr:hamlet`) */
type Suburb = [type: 'U' | 'R', suburb: string];

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
  suburb: Suburb;
  town: string;
  /** whether this address is a water address */
  water?: true;
  /** for stacked addresse, this is the number of addresses in this stack */
  flatCount?: number;
  /** for non-stacked addresses, this is the building level of this flat */
  level: string | undefined;
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

export type OsmAddr = Coords & {
  osmId: OsmId;
  housenumber?: string;
  /** for alternate addresses, the other house number */
  housenumberAlt?: string;
  street?: string;
  suburb?: Suburb;
  town?: string;
  isNonTrivial: boolean;
  checked: CheckDate;
  /** whether this address is a water address */
  water?: true;
  /** whether this address has `addr:suburb` and `addr:hamlet` */
  doubleSuburb?: true;
  /** whether this address is on a building AND has no linzRef */
  isUnRefedBuilding?: true;
  /** for stacked addresse, this is the number of addresses in this stack */
  flatCount?: number;
  /**
   * mappers can request that the system stacks or unstacks
   * certain addresses using the tag `linz:stack=yes/no`
   */
  stackRequest?: boolean;
  /** value of the `level` tag */
  level: string | undefined;
  /** if the feature has been recently edited */
  recentlyChanged?: true;
  /** if the last user to edit this feature was an importer */
  lastEditedByImporter?: true;
  /** for manually-merged alternate addresses, the linzRef of the other address */
  altRef?: AddressId;
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
  address_id: AddressId;

  unit_value: string;
  address_number: string;
  address_number_high: string;
  address_number_suffix: string;

  full_road_name: string;
  /** e.g. `Shelly Park` */
  suburb_locality: string;
  /** e.g. `Auckland`. The prescense of this field determines whether the OSM tag should be `addr:suburb` instead of `addr:hamlet` */
  town_city: string;
  /** stringified number (lng) */
  shape_X: string;
  /** stringified number (lat) */
  shape_Y: string;
  /** if a water address, this field will have the "suburb" instead of `suburb_locality` */
  water_name: string;
  /** e.g. B1 or 15 */
  level_value: string;

  // redundant information. don't use

  /** @deprecated */ address_class: 'Thoroughfare' | 'Water';
  /** @deprecated */ address_lifecycle: 'Current' | 'Proposed';
  /** @deprecated */ WKT: string;
  /** @deprecated */ change_id: string;
  /** @deprecated */ full_address_number: string;
  /** @deprecated */ water_route_name: string;
  /** @deprecated */ full_address: string;
  /** @deprecated */ road_section_id: string;
  /** @deprecated */ gd2000_xcoord: string;
  /** @deprecated */ gd2000_ycoord: string;
  /** @deprecated */ water_route_name_ascii: string;
  /** @deprecated */ water_name_ascii: string;
  /** @deprecated */ suburb_locality_ascii: string;
  /** @deprecated */ town_city_ascii: string;
  /** @deprecated */ full_road_name_ascii: string;
  /** @deprecated */ full_address_ascii: string;
  /** @deprecated */ source_dataset: 'AIMS' | 'CADS';
  /** @deprecated */ territorial_authority: string;
  /** @deprecated */ unit_type: string; // e.g. Shop, Flat, Unit, Villa, etc.
  /** @deprecated */ level_type: 'LEVEL' | 'LOWER GROUND' | '';
  /** @deprecated */ address_number_prefix: string;
  /** @deprecated */ road_name_prefix: string;
  /** @deprecated */ road_name: string;
  /** @deprecated */ road_name_ascii: string;
  /** @deprecated */ road_type_name: string;
  /** @deprecated */ road_suffix: string;
  /** @deprecated */ water_body_name: string;
  /** @deprecated */ water_body_name_ascii: string;
};

export type LinzChangelog = LinzSourceAddress & {
  __change__: 'INSERT' | 'UPDATE' | 'DELETE';
};
export type ChangelogJson = {
  add: { [suburb: string]: number };
  update: { [suburb: string]: number };
  delete: { [suburb: string]: number };
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
  | 'suburb'
  | 'town'
  | 'flatCount'
  | 'level'
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
    suburb: Suburb,
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
  count: Record<number, number>;
  date: string;
};

export type Coord = [lng: number, lat: number];

export type GeoJsonPoint = {
  type: 'Point';
  coordinates: Coord;
};
export type GeoJsonLine = {
  type: 'LineString';
  coordinates: Coord[];
};
export type GeoJsonArea = {
  type: 'Polygon';
  coordinates: Coord[][];
};
export type GeoJsonMultiPolygon = {
  type: 'MultiPolygon';
  coordinates: Coord[][][];
};
export type GeoJsonCoords =
  | GeoJsonPoint
  | GeoJsonLine
  | GeoJsonArea
  | GeoJsonMultiPolygon;
export type GeoJsonFeature<T = Record<string, string | undefined>> = {
  type: 'Feature';
  id: string;
  geometry: GeoJsonCoords;
  properties: T;
};
export type GeoJson<T = Record<string, string | undefined>> = {
  type: 'FeatureCollection';
  features: GeoJsonFeature<T>[];
  instructions?: string;
  changesetTags?: Tags;
};

export type BBox = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type HandlerReturn = Record<string, GeoJsonFeature[]>;
export type HandlerReturnWithBBox = {
  [sectorName: string]: {
    features: GeoJsonFeature[];
    bbox: BBox;
    instructions?: string;
    changesetTags?: Tags;
  };
};

export namespace GH {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  export type Issue = { body: string };
  export type IssueComment = { body: string };
}

export type ChunkSize = 'small' | 'medium' | 'large';
export type ExtraLayers = {
  [layerId: string]: {
    size: ChunkSize;
    instructions?: string;
    features: GeoJsonFeature[];
    changesetTags?: Tags;
  };
};

export type Tags = Record<string, string | undefined>;

export type CoordKey = `${number},${number}`;
/** a map of how many addresses at each coordinate in the LINZ dataset */
export type Overlapping = { [coordKey: CoordKey]: number };
