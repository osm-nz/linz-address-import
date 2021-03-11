/** U=Urban (`addr:suburb`), R=Rural (`addr:hamlet`) */
type Suburb = [type: 'U' | 'R', suburb: string];

export type OsmId = `${'n' | 'w' | 'r'}${string}`;

export type LinzAddr = {
  housenumber: string;
  street: string;
  suburb: Suburb;
  lat: number;
  lng: number;
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
  noRef: OsmAddr[];
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

  // redundant infomation. don't use

  address_type: 'Road' | 'Water';
  /** @deprecated */ WKT: string;
  /** @deprecated */ change_id: string;
  /** @deprecated */ unit_value: string;
  /** @deprecated */ address_number: string;
  /** @deprecated */ address_number_suffix: string;
  /** @deprecated */ address_number_high: string;
  /** @deprecated */ water_route_name: string;
  /** @deprecated */ water_name: string;
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
}

export enum Action {
  FIX = 1,
  ADD_REF = 2,
  ERROR = 3,
  MOVE = 4,
  CREATE = 5,
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
    osmId: string,
    linzLat: number,
    linzLng: number,
    osmLat: number,
    osmLng: number,
  ];
  [Status.TOTALLY_MISSING]: LinzAddr;
  [Status.NEEDS_DELETE]: [suburb: string, osmData: OsmAddr];
};

export type StatusReport = {
  [S in Status]: [linzId: string, diagnostics: StatusDiagnostics[S]][];
};
