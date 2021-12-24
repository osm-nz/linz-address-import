/** U=Urban (`addr:suburb`), R=Rural (`addr:hamlet`) */
type Suburb = [type: 'U' | 'R', suburb: string];

export type OsmId = `${'n' | 'w' | 'r'}${string}`;

export type Coords = {
  lat: number;
  lng: number;
};

export type LinzAddr = Coords & {
  housenumber: string;
  /** @deprecated don't use, for internal use in pre-process only */
  $houseNumberMsb?: string;
  street: string;
  suburb: Suburb;
  town: string;
  /** whether this address is a water address */
  water?: true;
  /** for stacked addresse, this is the number of addresses in this stack */
  flatCount?: number;
};
export type LinzData = {
  [linzId: string]: LinzAddr;
};

export type OsmAddr = Coords & {
  osmId: OsmId;
  housenumber?: string;
  street?: string;
  suburb?: Suburb;
  isNonTrivial: boolean;
  checked: boolean;
  /** whether this address is a water address */
  water?: true;
  /** whether this address has `addr:suburb` and `addr:hamlet` */
  doubleSuburb?: true;
  /** for stacked addresse, this is the number of addresses in this stack */
  flatCount?: number;
};
export type OsmAddrWithConfidence = OsmAddr & {
  /** distance in metres away from expected location */
  offset?: number;
  confidence: Confidence;
}; // 4=highest, 1=lowest
export type OSMData = {
  linz: {
    [linzId: string]: OsmAddr;
  };
  duplicateLinzIds: {
    [linzId: string]: OsmAddr[];
  };
  /** if an OSM node has mutliple values for the linz ref, seperated by a semicolon */
  semi: {
    [linzId: string]: OsmAddr;
  };
  noRef: OsmAddr[];
};

export type DeletionData = [linzId: string, suburb: string][];

export type CouldStackData = {
  [linzId: string]: [
    osmId: OsmId,
    suburb: string,
    readableAddr: string,
    meta: number | `${number}+${number}`,
  ];
};

export type LinzSourceAddress = {
  // we should be careful to use the same fields as the original import
  // https://git.nzoss.org.nz/ewblen/osmlinzaddr/-/blob/master/import-xref.sql#L156-166

  address_id: string;
  full_address_number: string;
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

  // redundant information. don't use

  address_type: 'Road' | 'Water';
  /** @deprecated */ WKT: string;
  /** @deprecated */ change_id: string;
  /** @deprecated */ unit_value: string;
  /** @deprecated */ address_number: string;
  /** @deprecated */ address_number_suffix: string;
  /** @deprecated */ address_number_high: string;
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

export type Issue = `${
  | 'housenumber'
  | 'street'
  | 'suburb'
  | 'water'}|${string}|${string}`; // `field|linzValue|osmValue`;

export type StatusDiagnostics = {
  [Status.PERFECT]: void;
  [Status.EXISTS_BUT_WRONG_DATA]: [
    osmAddr: OsmAddr,
    Suburb: string,
    ...issues: Issue[]
  ];
  [Status.EXISTS_BUT_NO_LINZ_REF]: [
    suburb: Suburb,
    confidence: Confidence,
    osmData: OsmAddr,
  ];
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: [
    confidence: Confidence,
    osmId: OsmId,
  ][];
  [Status.MULTIPLE_EXIST]: OsmId[];
  [Status.EXISTS_BUT_LOCATION_WRONG]: [
    metres: number,
    osmId: OsmId,
    linzLat: number,
    linzLng: number,
    osmLat: number,
    osmLng: number,
  ];
  [Status.TOTALLY_MISSING]: LinzAddr;
  [Status.NEEDS_DELETE]: [suburb: string, osmData: OsmAddr];
  [Status.NEEDS_DELETE_NON_TRIVIAL]: [suburb: string, osmData: OsmAddr];
  [Status.CORRUPT]: OsmAddr;
  [Status.LINZ_REF_CHANGED]: [
    suburb: string,
    newLinzId: string,
    osmData: OsmAddr,
    linzData: LinzAddr,
  ];
  [Status.COULD_BE_STACKED]: CouldStackData[string];
};

export type StatusReport = {
  [S in Status]: [linzId: string, diagnostics: StatusDiagnostics[S]][];
};

export type StatsFile = {
  total: number;
  count: Record<number, number>;
  date: string;
};

export type GeoJsonPoint = {
  type: 'Point';
  coordinates: [lng: number, lat: number];
};
export type GeoJsonLine = {
  type: 'LineString';
  coordinates: [lng: number, lat: number][];
};
export type GeoJsonArea = {
  type: 'Polygon';
  coordinates: [lng: number, lat: number][][];
};
export type GeoJsonMultiPolygon = {
  type: 'MultiPolygon';
  coordinates: [lng: number, lat: number][][][];
};
export type GeoJsonCoords =
  | GeoJsonPoint
  | GeoJsonLine
  | GeoJsonArea
  | GeoJsonMultiPolygon;
export type GeoJsonFeature = {
  type: 'Feature';
  id: string;
  geometry: GeoJsonCoords;
  properties: Record<string, string | undefined>;
};
export type GeoJson = {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
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
  };
};
