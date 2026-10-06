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

export type CoordKey = `${number},${number}`;
/** a map of how many addresses at each coordinate in the LINZ dataset */
export type Overlapping = { [coordKey: CoordKey]: number };
