import { SEAMARK_TYPE } from './const';

export type IHOTypes = keyof typeof SEAMARK_TYPE;
export type OSMSeamarkTypes = typeof SEAMARK_TYPE[IHOTypes];

/* eslint-disable @typescript-eslint/ban-types -- {} is okay */
type _SeamarkTypes = {
  // fields in _generic don't need to be specified in every section
  _generic: {
    fidn: string;
    /** prefer `nobjnm` */ objnam?: string;
    nobjnm?: string;
    /** prefer `ninfom` */ inform?: string;
    ninfom?: string;
    ntxtds?: string;
    /** prefer `ntxtds` */ txtdsc?: string;
    status?: string;
    sordat?: string;
    sorind?: string;
    datsta?: string;
    datend?: string;

    watlev?: string;
    colour?: string;
    colpat?: string;
    natcon?: string;
    condtn?: string;
    height?: string;
    conrad?: string;
    convis?: string;
    marsys?: string;
  };

  cable_submarine: {
    catcbl?: string;
  };
  cable_area: {
    catcbl?: string;
    restrn?: string;
  };
  platform: {
    verlen?: string;
    prodct?: string;
    catofp?: string;
  };
  anchorage: {
    catach?: string;
    persta?: string;
    perend?: string;
  };
  anchor_berth: {
    catach?: string;
    radius?: string;
    restrn?: string;
  };
  berth: {};
  daymark: {
    catspm?: string;
    topshp?: string;
  };
  dumping_ground: {
    catdpg?: string;
  };
  fishing_facility: {
    catfif?: string;
  };
  fog_signal: {
    catfog?: string;
    sigper?: string;
    sigfrq?: string;
    siggrp?: string;
    sigseq?: string;
    siggen?: string;
  };
  hulk: {
    cathlk?: string;
  };
  mooring: {
    boyshp?: string;
    catmor?: string;
  };
  pile: {
    catple?: string;
  };
  pilot_boarding: {
    catpil?: string;
    // comcha?: string;
    // pildst?: string;
  };
  pontoon: {};
  pylon: {
    catpyl?: string;
  };
  radar_station: {
    catras?: string;
  };
  radar_transponder: {
    catrtb?: string;
    radwal?: string;
    siggrp?: string;
  };
  'calling-in_point': {
    comcha?: string;
    orient?: string;
    trafic?: string;
  };
  radio_station: {
    // calsgn?: string;
    catros?: string;
  };
  restricted_area: {
    catrea?: string;
    restrn?: string;
  };
  rescue_station: {
    catrsc?: string;
  };
  sand_waves: {};
  seaplane_landing_area: {};
  spring: {};
  rock: {
    expsou?: string;
    natsur?: string;
    quasou?: string;
    valsou?: string;
    tecsou?: string;
    souacc?: string;
  };
  weed: {
    catwed?: string;
  };
  topmark: {
    catspm?: string;
    topshp?: string;
  };
  light: {
    catlit?: string;
    litchr?: string;
    litvis?: string;
    sectr1?: string;
    sectr2?: string;
    siggrp?: string;
    sigper?: string;
    sigseq?: string;
    valnmr?: string;
    mltylt?: string;
    exclit?: string;
  };
  distance_mark: {
    catdis?: string;
  };
  obstruction: {
    catobs?: string;
    tecsou?: string;
    natqua?: string;
  };
  beacon_cardinal: {
    catcam?: string;
    bcnshp?: string;
  };
  beacon_isolated_danger: {
    bcnshp?: string;
  };
  beacon_lateral: {
    bcnshp?: string;
    catlam?: string;
  };
  beacon_safe_water: {
    bcnshp?: string;
  };
  beacon_special_purpose: {
    bcnshp?: string;
    catspm?: string;
    elevat?: string;
  };
  buoy_cardinal: {
    boyshp?: string;
    catcam?: string;
  };
  buoy_isolated_danger: {
    boyshp?: string;
  };
  buoy_lateral: {
    boyshp?: string;
    catlam?: string;
  };
  buoy_safe_water: {
    boyshp?: string;
  };
  buoy_special_purpose: {
    boyshp?: string;
    catspm?: string;
    veracc?: string; // no seamark tag
    verlen?: string;
    picrep?: string;
  };
  wreck: {
    catwrk?: string;
  };
  pipeline_submarine: {
    catpip?: string;
    burdep?: string;
  };
  navigation_line: {
    catnav?: string;
    orient?: string;
    status?: string;
  };
  recommended_track: {
    cattrk?: string;
    trafic?: string;
    orient?: string;
  };
  virtual_aton: {
    clsnam?: string;
  };
  water_turbulence: {
    catwat?: string;
  };
  small_craft_facility: {
    catscf?: string;
  };
  harbour: {
    cathaf?: string;
  };
  production_area: {
    catpra?: string;
    prodct?: string;
  };
};
/* eslint-enable @typescript-eslint/ban-types */

// if this fails, one of the keys in the map above is invalid
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CompileTest = Pick<
  { [P in OSMSeamarkTypes]: never },
  keyof Omit<_SeamarkTypes, '_generic'>
>;

// from https://stackoverflow.com/a/50375286/5470183
type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * one huge type with every property defined in IHO-S57
 *
 * typescript is even smart enough to merge jsdoc comments for each attr
 */
export type AllSeamarkProps = UnionToIntersection<
  _SeamarkTypes[keyof _SeamarkTypes]
>;

// a bit of magic to merge the "_generic" object into each object, then delete "_generic"
export type Seamark = Omit<
  { [P in keyof _SeamarkTypes]: _SeamarkTypes[P] & _SeamarkTypes['_generic'] },
  '_generic'
>;
