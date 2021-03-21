/** U=Urban (`addr:suburb`), R=Rural (`addr:hamlet`) */
type Suburb = [type: 'U' | 'R', suburb: string];

export type OsmId = `${'n' | 'w' | 'r'}${string}`;

export type LinzAddr = {
  housenumber: string;
  street: string;
  suburb: Suburb;
  town: string;
  lat: number;
  lng: number;
  /** whether this address is a water address */
  water?: true;
};
export type LinzData = {
  [linzId: string]: LinzAddr;
};

export type OsmAddr = {
  osmId: OsmId;
  housenumber?: string;
  street?: string;
  suburb?: Suburb;
  lat: number;
  lng: number;
  isNonTrivial: boolean;
  checked: boolean;
  /** whether this address is a water address */
  water?: true;
};
export type OsmAddrWithConfidence = OsmAddr & {
  /** distance in metres away from expected location */
  offset?: number;
  confidence: 4 | 3 | 2 | 1;
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

  // redundant infomation. don't use

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
  UNKNOWN_ERROR = 12,
}

export type StatusDiagnostics = {
  [Status.PERFECT]: void;
  [Status.EXISTS_BUT_WRONG_DATA]: [
    osmId: string,
    ...issues: `${string}|${string}|${string}`[] // `field|linzValue|osmValue`
  ];
  [Status.EXISTS_BUT_NO_LINZ_REF]: [confidence: 1 | 2 | 3 | 4, osmId: OsmId];
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: [
    confidence: 1 | 2 | 3 | 4,
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
  ];
  [Status.UNKNOWN_ERROR]: OsmId;
};

export type StatusReport = {
  [S in Status]: [linzId: string, diagnostics: StatusDiagnostics[S]][];
};

export type StatsFile = {
  total: number;
  count: Record<number, number>;
  date: string;
};
export type LinzMetaFile = {
  version: string;
  /** the date that this version of the LINZ data was published */
  date: string;
};

type GeoJsonPoint = {
  type: 'Point';
  coordinates: [lng: number, lat: number];
};
type GeoJsonLine = {
  type: 'LineString';
  coordinates: [lng: number, lat: number][];
};
type GeoJsonArea = {
  type: 'Polygon';
  coordinates: [ring1: [lng: number, lat: number][]];
};
export type GeoJson = {
  type: 'FeatureCollection';
  crs: { type: 'name'; properties: { name: 'EPSG:4326' } };
  features: {
    type: 'Feature';
    id: string;
    geometry: GeoJsonPoint | GeoJsonLine | GeoJsonArea;
    properties: Record<string, string | undefined>;
  }[];
};
