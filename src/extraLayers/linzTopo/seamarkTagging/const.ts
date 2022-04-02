export const SEAMARK_TYPE = <const>{
  // https://wiki.osm.org/Seamarks/Seamark_Objects
  ACHARE: 'anchorage',
  ACHBRT: 'anchor_berth',
  BCNCAR: 'beacon_cardinal',
  BCNISD: 'beacon_isolated_danger',
  BCNLAT: 'beacon_lateral',
  BCNSAW: 'beacon_safe_water',
  BCNSPP: 'beacon_special_purpose',
  BERTHS: 'berth',
  BRIDGE: 'bridge',
  BUNSTA: 'bunker_station',
  BUISGL: 'building',
  BOYCAR: 'buoy_cardinal',
  BOYINB: 'buoy_installation',
  BOYISD: 'buoy_isolated_danger',
  BOYLAT: 'buoy_lateral',
  BOYSAW: 'buoy_safe_water',
  BOYSPP: 'buoy_special_purpose',
  CBLARE: 'cable_area',
  CBLOHD: 'cable_overhead',
  CBLSUB: 'cable_submarine',
  CAUSWY: 'causeway',
  CHKPNT: 'checkpoint',
  CGUSTA: 'coastguard_station',
  COMARE: 'communication_area',
  CTRPNT: 'control_point',
  DAYMAR: 'daymark',
  DISMAR: 'distance_mark',
  DRGARE: 'dredged_area',
  DMPGRD: 'dumping_ground',
  EXCNST: 'exceptional_structure',
  FAIRWY: 'fairway',
  FERYRT: 'ferry_route',
  FNCLNE: 'wall',
  FOGSIG: 'fog_signal',
  FORSTC: 'fortified_structure',
  FSHFAC: 'fishing_facility',
  GATCON: 'gate',
  GRIDRN: 'gridiron',
  HRBBSN: 'harbour_basin',
  HRBFAC: 'harbour',
  HULKES: 'hulk',
  ISTZNE: 'inshore_traffic_zone',
  LNDMRK: 'landmark',
  LIGHTS: 'light', // or 'light_major' or 'light_minor'
  LITFLT: 'light_float',
  LITVES: 'light_vessel',
  LOKBSN: 'lock_basin',
  MARCUL: 'marine_farm',
  MIPARE: 'military_area',
  MORFAC: 'mooring',
  MPAARE: 'protected_area',
  NAVLNE: 'navigation_line',
  NOTMRK: 'notice',
  OBSTRN: 'obstruction',
  OILBAR: 'oil_barrier',
  OFSPLF: 'platform',
  OSPARE: 'production_area',
  PILBOP: 'pilot_boarding',
  PILPNT: 'pile',
  PIPARE: 'pipeline_area',
  PIPOHD: 'pipeline_overhead',
  PIPSOL: 'pipeline_submarine',
  PONTON: 'pontoon',
  PRCARE: 'precautionary_area',
  PYLONS: 'pylon',
  RADLNE: 'radar_line',
  RADRNG: 'radar_range',
  RADRFL: 'radar_reflector',
  RTPBCN: 'radar_transponder',
  RADSTA: 'radar_station',
  RDOCAL: 'calling-in_point',
  RDOSTA: 'radio_station',
  RCRTCL: 'recommended_route_centreline',
  RECTRC: 'recommended_track',
  RCTLPT: 'recommended_traffic_lane',
  RSCSTA: 'rescue_station',
  RESARE: 'restricted_area',
  RETRFL: 'retro_reflector',
  SNDWAV: 'sand_waves',
  SBDARE: 'seabed_area',
  SEAARE: 'sea_area',
  SEAGRA: 'seagrass',
  SPLARE: 'seaplane_landing_area',
  SILTNK: 'tank',
  SLCONS: 'shoreline_construction',
  SISTAT: 'signal_station_traffic',
  SISTAW: 'signal_station_warning',
  SMCFAC: 'small_craft_facility',
  SPRING: 'spring',
  SUBTLN: 'submarine_transit_lane',
  TOPMAR: 'topmark',
  TSSBND: 'separation_boundary',
  TSSCRS: 'separation_crossing',
  TSSLPT: 'separation_lane',
  TSELNE: 'separation_line',
  TSSRON: 'separation_roundabout',
  TSEZNE: 'separation_zone',
  TRNBSN: 'turning_basin',
  TWRTPT: 'two-way_route',
  UWTROC: 'rock',
  VEGATN: 'vegetation',
  NEWOBJ: 'virtual_aton',
  VEHTRF: 'vehicle_transfer',
  WATTUR: 'water_turbulence',
  WTWGAG: 'waterway_gauge',
  WEDKLP: 'weed',
  WRECKS: 'wreck',
};

// if the OSM value differs from the IHO long value, use an array with two items
//
// for each key (E.g. PRODCT) more details are available from https://www.teledynecaris.com/s-57/attribut/PRODCT.htm
const MAP = <const>{
  //
  // generic - see https://wiki.osm.org/Seamarks/General_Attributes
  //
  PRODCT: {
    1: ['oil'],
    2: ['gas'],
    3: ['water'],
    4: ['stone'],
    5: ['coal'],
    6: ['ore'],
    7: ['chemicals'],
    8: ['drinking_water', 'Drinking water'],
    9: ['milk'],
    10: ['bauxite'],
    11: ['coke'],
    12: ['iron_ingots', 'Iron ingots'],
    13: ['salt'],
    14: ['sand'],
    15: ['timber'],
    16: ['sawdust', 'Sawdust/wood chips'],
    17: ['scrap metal'],
    18: ['lng', 'Liquified natural gas (LNG)'],
    19: ['lpg', 'Liquified petroleum gas (LPG)'],
    20: ['wine'],
    21: ['cement'],
    22: ['grain'],
  },
  STATUS: {
    1: ['permanent'],
    2: ['occasional'],
    3: ['recommended'],
    4: ['not_in_use', 'Not in use'],
    5: ['intermittent', 'Periodic/intermittent'],
    6: ['reserved'],
    7: ['temporary'],
    8: ['private'],
    9: ['mandatory'],
    /** @deprecated */ 10: ['destroyed', 'destroyed/ruined'],
    11: ['extinguished'],
    12: ['illuminated'],
    13: ['historic'],
    14: ['public'],
    15: ['synchronized'],
    16: ['watched'],
    17: ['unwatched', 'un-watched'],
    18: ['existence_doubtful', 'existence doubtful'],
    _19: ['on_request', 'on request'],
    _20: ['drop_away', 'drop away'],
    _21: ['rising'],
    _22: ['increasing'],
    _23: ['decreasing'],
    _24: ['strong'],
    _25: ['good'],
    _26: ['moderate'],
    _27: ['poor'],
  },
  CONDTN: {
    1: ['under_construction', 'under construction'],
    2: ['ruinied'],
    3: ['under_reclamation', 'under reclamation'],
    4: ['wingless'],
    5: ['planned_construction', 'planned construction'],
  },
  CONRAD: {
    1: ['conspicuous', 'radar conspicuous'],
    2: ['not_conspicuous', 'not radar conspicuous'],
    3: ['reflector', 'radar conspicuous (has radar reflector)'],
  },
  CONVIS: {
    1: ['conspicuous', 'Visually conspicuous'],
    2: ['not_conspicuous', 'Not visually conspicuous'],
  },
  TRAFIC: {
    1: ['inbound'],
    2: ['outbound'],
    3: ['one-way'],
    4: ['two-way'],
  },
  NATCON: {
    1: ['masonry'],
    2: ['concreted'],
    3: ['loose_boulders', 'loose boulders'],
    4: ['hard-surfaced', 'hard surfaced'],
    5: ['unsurfaced'],
    6: ['wooden'],
    7: ['metal'],
    8: ['grp', 'glass reinforced plastic (GRP)'],
    9: ['painted'],
    _10: ['framework'],
  },
  NATSUR: {
    1: ['mud'],
    2: ['clay'],
    3: ['silt'],
    4: ['sand'],
    5: ['stone'],
    6: ['gravel'],
    7: ['pebbles'],
    8: ['cobbles'],
    9: ['rock'],
    /** @deprecated */ 10: ['marsh'],
    11: ['lava'],
    /** @deprecated */ 12: ['snow'],
    /** @deprecated */ 13: ['ice'],
    14: ['coral'],
    /** @deprecated */ 15: ['swamp'],
    /** @deprecated */ 16: ['bog', 'bog/moor'],
    17: ['shells'],
    18: ['boulder'],
  },
  WATLEV: {
    1: ['part-submerged', 'partly submerged at high water'],
    2: ['dry', 'always dry'],
    3: ['submerged', 'always under water/submerged'],
    4: ['covers', 'covers and uncovers'],
    5: ['awash'],
    6: ['floods', 'subject to inundation or flooding'],
    7: ['floating'],
    _8: ['above_mwl', 'Above mean water level'],
    _9: ['below_mwl', 'Below mean water level'],
  },
  COLOUR: {
    1: ['white'],
    2: ['black'],
    3: ['red'],
    4: ['green'],
    5: ['blue'],
    6: ['yellow'],
    7: ['grey'],
    8: ['brown'],
    9: ['amber'],
    10: ['violet'],
    11: ['orange'],
    12: ['magenta'],
    13: ['pink'],
  },
  COLPAT: {
    1: ['horizontal', 'horizontal stripes'],
    2: ['vertical', 'vertical stripes'],
    3: ['diagonal', 'diagonal stripes'],
    4: ['squared', 'squared'],
    5: ['stripes', 'stripes (direction unknown)'],
    6: ['border', 'border stripe'],
    _7: ['cross', 'Vertical cross'],
    _8: ['saltire', 'Diagonal cross'],
  },
  NATQUA: {
    1: ['fine'],
    2: ['medium'],
    3: ['coarse'],
    4: ['broken'],
    5: ['sticky'],
    6: ['soft'],
    7: ['stiff'],
    8: ['volcanic'],
    9: ['calcareous'],
    10: ['hard'],
  },

  //
  // categrories - see https://wiki.osm.org/Seamarks/Categories_of_Objects
  //
  CATOBS: {
    1: ['stump', 'snag/stump'],
    2: ['wellhead'],
    3: ['diffuser'],
    4: ['crib'],
    5: ['fish_haven', 'fish haven'],
    6: ['foul_area', 'foul area'],
    7: ['foul_ground', 'foul ground'],
    8: ['ice_boom', 'ice boom'],
    9: ['ground_tackle', 'ground tackle'],
    10: ['boom'],
  },
  CATOFP: {
    1: ['oil', 'oil derrick/rig'],
    2: ['production', 'production platform'],
    3: ['observation', 'observation/research platform'],
    4: ['alp', 'articulated loading platform (alp)'],
    5: ['salm', 'single anchor leg mooring (salm)'],
    6: ['mooring', 'mooring tower'],
    7: ['artificial_island', 'artificial island'],
    8: ['fpso', 'floating production, storage and off-loading vessel (fpso)'],
    9: ['accommodation', 'accommodation platform'],
    10: ['nccb', 'navigation, communication and control buoy (nccb)'],
  },
  CATCBL: {
    1: ['power', 'power line'],
    /** @deprecated */ 2: ['', 'telephone/telegraph'],
    3: ['transmission', 'transmission line'],
    4: ['telephone'],
    5: ['telegraph'],
    6: ['mooring', 'mooring cable/chain'],
    _7: ['optical', 'Fibre optic cable'],
    _8: ['ferry', 'Ferry cable'],
  },
  CATREA: {
    1: ['safety', 'offshore safety zone'],
    /** @deprecated */ 2: ['', 'anchoring prohibition area'],
    /** @deprecated */ 3: ['', 'fishing prohibition area'],
    4: ['nature_reserve', 'nature reserve'],
    5: ['bird_sanctuary', 'bird sanctuary'],
    6: ['game_reserve', 'game reserve'],
    7: ['seal_sanctuary', 'seal sanctuary'],
    8: ['degaussing_range', 'degaussing range'],
    9: ['military', 'military area'],
    10: ['historic_wreck', 'historic wreck area'],
    /** @deprecated */ 11: ['', 'inshore traffic zone'],
    12: ['navigational_aid_safety', 'navigational aid safety zone'],
    /** @deprecated */ 13: ['', 'danger of stranding area'],
    14: ['minefield'],
    /** @deprecated */ 15: ['', 'diving prohibition area'],
    /** @deprecated */ 16: ['', 'area to be avoided'],
    /** @deprecated */ 17: ['', 'Prohibited area'],
    18: ['swimming', 'swimming area'],
    19: ['waiting', 'waiting area'],
    20: ['research', 'research area'],
    21: ['dredging', 'dredging area'],
    22: ['fish_sanctuary', 'fish sanctuary'],
    23: ['ecological_reserve', 'ecological reserve'],
    24: ['no_wake', 'no wake area'],
    25: ['swinging', 'swinging area'],
    26: ['water_skiing', 'water skiing area'],
    27: ['essa', 'Environmentally Sensitive Sea Area (ESSA)'],
    28: ['pssa', 'Particularly Sensitive Sea Area (PSSA)'],
  },
  CATPIL: {
    1: ['cruising_vessel', 'boarding by pilot-cruising vessel'],
    2: ['helicopter', 'boarding by helicopter'],
    3: ['from_shore', 'pilot comes out from shore'],
  },
  CATDPG: {
    1: ['general', 'general dumping ground'],
    2: ['chemical', 'chemical waste dumping ground'],
    3: ['nuclear', 'nuclear waste dumping ground'],
    4: ['explosives', 'explosives dumping ground'],
    5: ['spoil', 'spoil ground'],
    6: ['vessel', 'vessel dumping ground'],
  },
  CATHLK: {
    1: ['floating_restaurant', 'floating restaurant'],
    2: ['historic', 'historic ship'],
    3: ['museum'],
    4: ['accommodation'],
    5: ['floating_breakwater', 'floating breakwater'],
    _6: ['casino_boat', 'casino boat'],
  },
  CATPLE: {
    1: ['stake'],
    /** @deprecated */ 2: ['snag'],
    3: ['post'],
    4: ['tripodal'],
  },
  CATPYL: {
    1: ['power', 'power transmission pylon/pole'],
    2: ['telecom', 'telephone/telegraph pylon/pole'],
    3: ['aerial', 'aerial cableway/sky pylon'],
    4: ['bridge', 'bridge pylon/tower'],
    5: ['bridge_pier', 'bridge pier'],
  },
  CATRAS: {
    1: ['surveillance', 'radar surveillance station'],
    2: ['coast', 'coast radar station'],
  },
  CATRSC: {
    1: ['lifeboat', 'rescue station with lifeboat'],
    2: ['rocket', 'rescue station with rocket'],
    /** @deprecated */ 3: ['', 'rescue station with lifeboat and rocket'],
    4: ['refuge_shipwrecked', 'refuge for shipwrecked mariners'],
    5: ['refuge_intertidal', 'refuge for intertidal area walkers'],
    6: ['lifeboat_on_mooring', 'lifeboat lying at a mooring'],
    7: ['radio', 'aid radio station'],
    8: ['first_aid', 'first aid equipment'],
    _9: ['seaplane', 'Rescue seaplane'],
    _10: ['aircraft', 'Rescue aircraft'],
    _11: ['tug', 'Salvage tug'],
  },
  CATWED: {
    1: ['kelp'],
    2: ['sea_weed', 'sea weed'],
    3: ['sea_grass', 'sea grass'],
    4: ['saragasso'],
  },
  CATWAT: {
    1: ['breakers'],
    2: ['eddies'],
    3: ['overfalls'],
    4: ['tide_rips', 'tide rips'],
    5: ['bombora'],
  },
  CATSCF: {
    1: ['visitor_berth', 'visitor’s berth'],
    2: ['nautical_club', 'nautical club'],
    3: ['boat_hoist', 'boat hoist'],
    4: ['sailmaker'],
    5: ['boatyard'],
    6: ['public_inn', 'public inn'],
    7: ['restaurant'],
    8: ['chandler'],
    9: ['provisions'],
    10: ['doctor'],
    11: ['pharmacy'],
    12: ['water_tap', 'water tap'],
    13: ['fuel_station', 'fuel station'],
    14: ['electricity'],
    15: ['bottle_gas', 'bottle gas'],
    16: ['showers'],
    17: ['launderette'],
    18: ['toilets', 'public toilets'],
    19: ['post_box', 'post box'],
    20: ['telephone', 'public telephone'],
    21: ['refuse_bin', 'refuse bin'],
    22: ['car_park', 'car park'],
    23: ['boat_trailers_park', 'parking for boats and trailers'],
    24: ['caravan_site', 'caravan site'],
    25: ['camping_site', 'camping site'],
    26: ['pump-out', 'sewerage pump-out station'],
    27: ['emergency_telephone', 'emergency telephone'],
    28: ['slipway', 'landing/launching place for boats'],
    29: ['visitors_mooring', 'visitors mooring'],
    30: ['scrubbing_berth', 'scrubbing berth'],
    31: ['picnic_area', 'picnic area'],
    32: ['mechanics_workshop', 'mechanics workshop'],
    33: ['security_service', 'guard and/ or security service'],
  },
  CATHAF: {
    1: ['roro', 'RoRo-terminal'],
    /** @deprecated */ 2: ['timber', 'timber yard'],
    3: ['ferry', 'ferry terminal'],
    4: ['fishing', 'fishing harbour'],
    5: ['marina', 'yacht harbour/marina'],
    // marina_no_facilities
    6: ['naval', 'naval base'],
    7: ['tanker', 'tanker terminal'],
    8: ['passenger', 'passenger terminal'],
    9: ['shipyard'],
    10: ['container', 'container terminal'],
    11: ['bulk', 'bulk terminal'],
    12: ['syncrolift'],
    13: ['straddle_carrier', 'straddler carrier'],
    // lay_up
    // service_repair
    // quarantine
    // seaplane
    // cargo
    // offshore_support
    // port_support
  },
  CATPRA: {
    1: ['quarry'],
    2: ['mine'],
    3: ['stockpile'],
    4: ['power_station', 'power station area'],
    5: ['refinery', 'refinery area'],
    6: ['timber_yard', 'timber yard'],
    7: ['factory', 'factory area'],
    8: ['tank_farm', 'tank farm'],
    9: ['wind_farm', 'wind farm'],
    10: ['slag_heap', 'slag heaps/spoil heap'],
    // current_farm
    // oil
    // gas
    // wave_energy
  },
  CATPIP: {
    1: ['', 'pipeline in general'],
    2: ['outfall', 'outfall pipe'],
    3: ['intake', 'intake pipe'],
    4: ['sewer', 'sewer'],
    5: ['bubbler', 'bubbler system'],
    6: ['supply', 'supply pipe'],
  },
  CATLIT: {
    1: ['directional', 'directional function'],
    /** @deprecated */ 2: ['', 'rear/upper light'],
    /** @deprecated */ 3: ['', 'front/lower light'],
    4: ['leading', 'leading light'],
    5: ['aero', 'aero light'],
    6: ['air_obstruction', 'air obstruction light'],
    7: ['fog_detector', 'fog detector light'],
    8: ['floodlight', 'flood light'],
    9: ['strip_light', 'strip light'],
    10: ['subsidiary', 'subsidiary light'],
    11: ['spotlight'],
    12: ['front'],
    13: ['rear'],
    14: ['lower'],
    15: ['upper'],
    16: ['moire', 'moiré effect'],
    17: ['emergency'],
    18: ['bearing', 'bearing light'],
    19: ['horizontal', 'horizontally disposed'],
    20: ['vertical', 'vertically disposed'],
  },
  CATCAM: {
    1: ['north', 'north cardinal mark'],
    2: ['east', 'east cardinal mark'],
    3: ['south', 'south cardinal mark'],
    4: ['west', 'west cardinal mark'],
  },
  CATLAM: {
    1: ['port', 'port-hand lateral mark'],
    2: ['starboard', 'starboard-hand lateral mark'],
    3: [
      'preferred_channel_starboard',
      'preferred channel to starboard lateral mark',
    ],
    4: ['preferred_channel_port', 'preferred channel to port lateral mark'],
    _5: ['waterway_right', 'Right-hand side of the waterway'],
    _6: ['waterway_left', 'Left-hand side of the waterway'],
    _7: ['channel_right', 'Right-hand side of the channel'],
    _8: ['channel_left', 'Left-hand side of the channel'],
    _9: ['waterway_separation', 'Bifurcation of the waterway'],
    _10: ['channel_separation', 'Bifurcation of the fairway'],
    _11: ['channel_right_bank', 'Channel near the right bank'],
    _12: ['channel_left_bank', 'Channel near the left bank'],
    _13: ['crossover_right', 'Channel cross-over to the right bank'],
    _14: ['crossover_left', 'Channel cross-over to the left bank'],
    _15: ['danger_right', 'Danger point or obstacles at the right-hand side'],
    _16: ['danger_left', 'Danger point or obstacles at the left-hand side'],
    _17: ['turnoff_right', 'Turn off at the right-hand side'],
    _18: ['turnoff_left', 'Turn off at the left-hand side'],
    _19: ['junction_right', 'Junction at the right-hand side'],
    _20: ['junction_left', 'Junction at the left-hand side'],
    _21: ['harbour_right', 'Harbour entry at the right-hand side'],
    _22: ['harbour_left', 'Harbour entry at the left-hand side'],
    _23: ['bridge_pier', 'Bridge pier mark'],
  },
  CATFIF: {
    1: ['stake', 'fishing stake'],
    2: ['trap', 'fish trap'],
    3: ['weir', 'fish weir'],
    4: ['tunny', 'tunny net'],
  },

  //
  // special categories
  //
  CATDIS: {
    // https://wiki.osm.org/Seamarks/Distance_Marks
    1: ['not_installed', 'distance mark not physically installed'],
    2: ['pole', 'visible mark, pole'],
    3: ['board', 'visible mark, board'],
    4: ['unknown_shape', 'visible mark, unknown shape'],
  },
  CATROS: {
    // https://wiki.osm.org/Seamarks/Radio_Stations
    1: [
      'omnidirectional',
      'circular (non-directional) marine or aero-marine radiobeacon',
    ],
    2: ['directional', 'directional radiobeacon'],
    3: ['rotating_pattern', 'rotating-pattern radiobeacon'],
    4: ['consol', 'Consol beacon'],
    5: ['rdf', 'radio direction-finding station'],
    6: ['qtg', 'coast radio station providing QTG service'],
    7: ['aeronautical', 'aeronautical radiobeacon'],
    8: ['decca'],
    9: ['loran', 'Loran C'],
    10: ['dgps', 'Differential GPS'],
    11: ['toran'],
    12: ['omega'],
    13: ['syledis'],
    14: ['chiaka', 'Chaika (Chayka)'],
    _15: ['public_communication', 'Public communication (for conversations)'],
    _16: ['commercial_broadcast', 'Commercial broadcast'],
    _17: ['facsimile', 'Facsimile transmission'],
    _18: ['time_signal', 'Time signal'],
    _19: ['ais_base', 'AIS Base Station'],
    _20: ['ais', 'Physical AIS'],
  },
  CATACH: {
    // https://wiki.osm.org/Seamarks/Anchorages
    1: ['unrestricted', 'unrestricted anchorage'],
    2: ['deep_water', 'deep water anchorage'],
    3: ['tanker', 'tanker anchorage'],
    4: ['explosives', 'explosives anchorage'],
    5: ['quarantine', 'quarantine anchorage'],
    6: ['seaplane', 'sea-plane anchorage'],
    7: ['small_craft', 'small craft anchorage'],
    8: ['small_craft_mooring', 'small craft mooring area'],
    9: ['24_hour', 'anchorage for periods up to 24 hours'],
    10: ['limited_period', 'anchorage for a limited period of time'],
    _11: ['pushing', 'Anchorage for pushing-navigation vessels'],
    _12: ['limited_period', 'Anchorage for a limited period of time'],
    _13: [
      'non_pushing',
      'Anchorage for other vessels than pushing-navigation vessels',
    ],
    _14: ['dry_cargo', 'Anchorage for dry cargo vessels'],
    _15: ['raft', 'Anchorage for rafts'],
  },
  CATFOG: {
    // https://wiki.osm.org/Seamarks/Fog_Signals
    1: ['explosive'],
    2: ['diaphone'],
    3: ['siren'],
    4: ['nautophone'],
    5: ['reed'],
    6: ['tyfon'],
    7: ['bell'],
    8: ['whistle'],
    9: ['gong'],
    10: ['horn'],
  },
  CATNAV: {
    // https://wiki.osm.org/Seamarks/Leading_Lines
    1: ['clearing', 'clearing line'],
    2: ['transit', 'transit line'],
    3: ['leading', 'leading line bearing a recommended track'],
  },
  CATTRK: {
    // https://wiki.osm.org/Seamarks/Leading_Lines
    1: ['fixed_marks', 'based on a system of fixed marks'],
    2: ['no_fixed_marks', 'not based on a system of fixed marks'],
  },
  CATMOR: {
    // https://wiki.osm.org/Seamarks/Moorings
    1: ['dolphin'],
    2: ['deviation_dolphin', 'deviation dolphin'],
    3: ['bollard'],
    4: ['wall', 'tie-up wall'],
    5: ['pile', 'post or pile'],
    6: ['chain', 'chain/wire/cable'],
    7: ['buoy', 'mooring buoy'],
    _8: ['shore_ropes'],
    _9: ['automatic'],
    _10: ['trot'],
  },
  CATRTB: {
    // https://wiki.osm.org/Seamarks/Radar_Beacons
    1: ['ramark', 'ramark, radar beacon transmitting continuously'],
    2: ['racon', 'racon, radar transponder beacon'],
    3: ['leading', 'leading racon/radar transponder beacon'],
  },
  CATWRK: {
    // from https://wiki.osm.org/Seamarks/Wrecks
    1: ['non-dangerous', 'non-dangerous wreck'],
    2: ['dangerous', 'dangerous wreck'],
    3: ['distributed_remains', 'distributed remains of wreck'],
    4: ['mast_showing', 'wreck showing mast/masts'],
    5: ['hull_showing', 'wreck showing any portion of hull or superstructure'],
  },
  CATSPM: {
    // https://wiki.osm.org/Seamarks/Special_Purpose_Marks
    1: ['firing_danger_area', 'Firing danger mark'],
    2: ['target', 'Target mark'],
    3: ['marker_ship', 'Marker ship mark'],
    4: ['degaussing_range', 'Degaussing range mark'],
    5: ['barge', 'Barge mark'],
    6: ['cable', 'Cable mark'],
    7: ['spoil_ground', 'Spoil ground mark'],
    8: ['outfall', 'Outfall mark'],
    9: ['odas', 'ODAS'],
    10: ['recording', 'Recording mark'],
    11: ['seaplane_anchorage', 'Seaplane anchorage mark'],
    12: ['recreation_zone', 'Recreation zone mark'],
    13: ['private', 'Private mark'],
    14: ['mooring', 'Mooring mark'],
    15: ['lanby', 'LANBY'],
    16: ['leading', 'Leading mark'],
    17: ['measured_distance', 'Measured distance mark'],
    18: ['notice', 'Notice mark'],
    19: ['tss', 'TSS mark'],
    20: ['no_anchoring', 'Anchoring prohibited mark'],
    21: ['no_berthing', 'Berthing prohibited mark'],
    22: ['no_overtaking', 'Overtaking prohibited mark'],
    23: ['no_two-way_traffic', 'Two-way traffic prohibited mark'],
    24: ['reduced_wake', 'Reduced wake mark'],
    25: ['speed_limit', 'Speed limit mark'],
    26: ['stop', 'Stop mark'],
    27: ['warning', 'General warning mark'],
    28: ['sound_ship_siren', 'Sound ships siren mark'],
    29: ['restricted_vertical_clearance', 'Restricted vertical clearance mark'],
    30: ['maximum_vessel_draught', "Maximum vessel's draught mark"],
    31: [
      'restricted_horizontal_clearance',
      'Restricted horizontal clearance mark',
    ],
    32: ['strong_current', 'Strong current warning mark'],
    33: ['berthing', 'Berthing permitted mark'],
    34: ['overhead_power_cable', 'Overhead power cable mark'],
    35: ['channel_edge_gradient', 'Channel edge gradient mark'],
    36: ['telephone', 'Telephone mark'],
    37: ['ferry_crossing', 'Ferry crossing mark'],
    38: ['marine_traffic_lights', 'marine traffic lights'],
    39: ['pipeline', 'Pipeline mark'],
    40: ['anchorage', 'Anchorage mark'],
    41: ['clearing', 'Clearing mark'],
    42: ['control', 'Control mark'],
    43: ['diving', 'Diving mark'],
    44: ['refuge_beacon', 'Refuge beacon'],
    45: ['foul_ground', 'Foul ground mark'],
    46: ['yachting', 'Yachting mark'],
    47: ['heliport', 'Heliport mark'],
    48: ['gps', 'GPS mark'],
    49: ['seaplane_landing', 'Seaplane landing mark'],
    50: ['no_entry', 'Entry prohibited mark'],
    51: ['work_in_progress', 'Work in progress mark'],
    52: ['unknown_purpose', 'Mark with unknown purpose'],
    53: ['wellhead', 'Wellhead mark'],
    54: ['channel_separation', 'Channel separation mark'],
    55: ['marine_farm', 'Marine farm mark'],
    56: ['artificial_reef', 'Artificial reef mark'],
    57: ['ice', 'Ice Mark'],
    58: ['nature_reserve', 'Nature Reserve Mark'],
    59: ['fish_aggregator', 'Fish Aggregating Device'],
    60: ['wreck', 'Wreck mark'],
    61: ['customs', 'Customs Mark'],
    62: ['causeway', 'Causeway Mark'],
    63: ['wave_recorder', 'Wave Recorder'],
    64: ['no_jetski', 'Jetski Prohibited'],
  },
  CLSNAM: {
    // numbers are arbitrary
    1: ['north_cardinal', 'Virtual AtoN, North Cardinal'],
    2: ['south_cardinal', 'Virtual AtoN, East Cardinal'],
    3: ['east_cardinal', 'Virtual AtoN, South Cardinal'],
    4: ['west_cardinal', 'Virtual AtoN, West Cardinal'],
    5: ['port_lateral', 'Virtual AtoN, Port Lateral'],
    6: ['starboard_lateral', 'Virtual AtoN, Starboard Lateral'],
    7: ['isolated_danger', 'Virtual AtoN, Isolated Danger'],
    8: ['safe_water', 'Virtual AtoN, Safe Water'],
    9: ['special_purpose', 'Virtual AtoN, Special Purpose'],
    10: ['wreck', 'Virtual AtoN, Wreck Marking'],
    11: ['preferred_port', 'Virtual AtoN, Preferred Channel Port'],
    12: ['preferred_starboard', 'Virtual AtoN, Preferred Channel Starboard'],
  },

  //
  // misc
  //
  MARSYS: {
    // https://wiki.osm.org/Seamarks/Buoyage_Systems
    1: ['iala-a', 'IALA A'],
    2: ['iala-b', 'IALA B'],
    /** @deprecated */ 3: ['', 'modified US'],
    /** @deprecated */ 4: ['', 'old US'],
    /** @deprecated */ 5: ['', 'US intracoastal waterway'],
    /** @deprecated */ 6: ['', 'US uniform state'],
    /** @deprecated */ 7: ['', 'US western rivers'],
    /** @deprecated */ 8: ['', 'SIGNI'],
    9: ['none', 'no system'],
    10: ['other', 'other system'],
  },
  EXCLIT: {
    // https://wiki.osm.org/Seamarks/Lights
    1: ['24h', 'light shown without change of character'],
    2: ['day', 'daytime light'],
    3: ['fog', 'fog light'],
    4: ['night', 'night light'],
    _5: ['warning'],
    _6: ['storm'],
  },
  TECSOU: {
    // https://wiki.osm.org/Key:depth
    1: ['echo', 'found by echo- sounder'],
    2: ['sonar', 'found by side scan sonar'],
    3: ['multi-beam', 'found by multi-beam'],
    4: ['diver', 'found by diver'],
    5: ['lead-line', 'found by lead-line'],
    6: ['wire-drag', 'swept by wire-drag'],
    7: ['laser', 'found by laser'],
    8: ['acoustic', 'swept by vertical acoustic system'],
    9: ['electromagnetic', 'found by electromagnetic sensor'],
    10: ['photogrammetry'],
    11: ['satellite_imagery', 'satellite imagery'],
    12: ['levelling', 'found by levelling'],
    13: ['sonar', 'swept by side-scan sonar'],
    14: ['computer_generated', 'computer generated'],
  },
  RESTRN: {
    // https://wiki.osm.org/Seamarks/Restrictions
    1: ['no_anchoring', 'anchoring prohibited'],
    2: ['restricted_anchoring', 'anchoring restricted'],
    3: ['restricted_anchoring', 'fishing prohibited'],
    4: ['restricted_fishing', 'fishing restricted'],
    5: ['no_trawling', 'trawling prohibited'],
    6: ['restricted_trawling', 'trawling restricted'],
    7: ['no_entry', 'entry prohibited'],
    8: ['restricted_entry', 'entry restricted'],
    9: ['no_dredging', 'dredging prohibited'],
    10: ['restricted_dredging', 'dredging restricted'],
    11: ['no_diving', 'diving prohibited'],
    12: ['restricted_diving', 'diving restricted'],
    13: ['no_wake', 'no wake'],
    14: ['to_be_avoided', 'area to be avoided'],
    15: ['no_construction', 'construction prohibited'],
    16: ['no_discharging', 'discharging prohibited'],
    17: ['restricted_discharging', 'discharging restricted'],
    18: [
      'no_exploration_development',
      'industrial or mineral exploration/development prohibited',
    ],
    19: [
      'restricted_exploration_development',
      'industrial or mineral exploration/development restricted',
    ],
    20: ['no_drilling', 'drilling prohibited'],
    21: ['restricted_drilling', 'drilling restricted'],
    22: [
      'no_historical_artifacts_removal',
      'removal of historical artifacts prohibited',
    ],
    23: ['no_lightering', 'cargo transhipment (lightering) prohibited'],
    24: ['no_dragging', 'dragging prohibited'],
    25: ['no_stopping', 'stopping prohibited'],
    26: ['no_landing', 'landing prohibited'],
    27: ['restricted_speed', 'speed restricted'],
    _28: ['no_overtaking', 'Overtaking prohibited'],
    _29: [
      'no_convoy_overtaking',
      'Overtaking of convoys by convoys prohibited',
    ],
    _30: ['no_passing_overtaking', 'Passing or overtaking prohibited'],
    _31: ['no_berthing', 'Berthing prohibited'],
    _32: ['restricted_berthing', 'Berthing restricted'],
    _33: ['no_making_fast', 'Making fast prohibited'],
    _34: ['restricted_making_fast', 'Making fast restricted'],
    _35: ['no_turning', 'Turning prohibited'],
    _36: ['restricted_fairway_depth', 'Restricted fairway depth'],
  },
  SIGGEN: {
    // https://wiki.osm.org/Seamarks/Fog_Signals
    1: ['automatic', 'automatically'],
    2: ['wave', 'by wave action'],
    3: ['hand', 'by hand'],
    4: ['wind', 'by wind'],
  },
  QUASOU: {
    // https://wiki.osm.org/Key:depth
    1: ['known', 'depth known'],
    2: ['unknown', 'depth unknown'],
    3: ['doubtful', 'doubtful sounding'],
    4: ['unreliable', 'unreliable sounding'],
    5: ['no_bottom', 'no bottom found at value shown'],
    6: ['least_depth_known', 'least depth known'],
    7: [
      'least_depth_unknown',
      'least depth unknown, safe clearance at value shown',
    ],
    8: ['not_surveyed', 'value reported (not surveyed)'],
    9: ['not_confirmed', 'value reported (not confirmed)'],
    10: ['maintained', 'maintained depth'],
    11: ['not_maintained', 'not regularly maintained'],
  },
  EXPSOU: {
    // https://wiki.osm.org/Key:depth
    1: [
      'within_range',
      'within the range of depth of the surrounding depth area',
    ],
    2: [
      'shoaler',
      'shoaler than the range of depth of the surrounding depth area',
    ],
    3: [
      'deeper',
      'deeper than the range of depth of the surrounding depth area',
    ],
  },
  BOYSHP: {
    // https://wiki.osm.org/Seamarks/Buoys
    1: ['conical', 'conical (nun, ogival)'],
    2: ['can', 'can (cylindrical)'],
    3: ['spherical'],
    4: ['pillar'],
    5: ['spar', 'spar (spindle)'],
    6: ['barrel', 'barrel (tun)'],
    7: ['super-buoy'],
    8: ['ice_buoy', 'ice buoy'],
  },
  BCNSHP: {
    1: ['pole', 'stake, pole, perch, post'],
    2: ['withy'],
    3: ['tower', 'beacon tower'],
    4: ['lattice', 'lattice beacon'],
    5: ['pile', 'pile beacon'],
    6: ['cairn', 'cairn'],
    7: ['buoyant', 'buoyant beacon'],
  },
  LITCHR: {
    // https://wiki.osm.org/Seamarks/Lights
    1: ['F', 'fixed'],
    2: ['Fl', 'flashing'],
    3: ['LFl', 'long-flashing'],
    4: ['Q', 'quick-flashing'],
    5: ['VQ', 'very quick-flashing'],
    6: ['UQ', 'ultra quick-flashing'],
    7: ['Iso', 'isophased'],
    8: ['Oc', 'occulting'],
    9: ['IQ', 'interrupted quick-flashing'],
    10: ['IVQ', 'interrupted very quick- flashing'],
    11: ['IUQ', 'interrupted ultra quick- flashing'],
    12: ['Mo', 'morse'],
    13: ['FFl', 'fixed/flash'],
    14: ['FlLFl', 'flash/long-flash'],
    15: ['OcFl', 'occulting/flash'],
    16: ['FLFl', 'fixed/long-flash'],
    17: ['Al.Oc', 'occulting alternating'],
    18: ['Al.LFl', 'long-flash alternating'],
    19: ['Al.Fl', 'flash alternating'],
    20: ['Al.Gr', 'group alternating'],
    /** @deprecated */ 21: ['', '2 fixed (vertical)'],
    /** @deprecated */ 22: ['', '2 fixed (horizontal)'],
    /** @deprecated */ 23: ['', '3 fixed (vertical)'],
    /** @deprecated */ 24: ['', '3 fixed (horizontal)'],
    25: ['Q+LFl', 'quick-flash plus long- flash'],
    26: ['VQ+LFl', 'very quick-flash plus long- flash'],
    27: ['UQ+LFl', 'ultra quick-flash plus long- flash'],
    28: ['Al', 'alternating'],
    29: ['Al.FFl', 'fixed and alternating flashing'],
  },
  LITVIS: {
    // https://wiki.osm.org/Seamarks/Lights
    1: ['high', 'high intensity'],
    2: ['low', 'low intensity'],
    3: ['faint'],
    4: ['intensified'],
    5: ['unintensified'],
    6: ['restricted', 'visibility deliberately restricted'],
    7: ['obscured'],
    8: ['part_obscured', 'partially obscured'],
  },
  TOPSHP: {
    // https://wiki.osm.org/Seamarks/Topmarks_and_Daymarks
    1: ['cone, point up'],
    2: ['cone, point down'],
    3: ['sphere'],
    4: ['2 spheres'],
    5: ['cylinder', 'cylinder (can)'],
    6: ['board'],
    7: ['x-shape', "x-shape (St. Andrew's cross)"],
    8: ['cross', "upright cross (St George's cross)"],
    9: ['cube, point up'],
    10: ['2 cones point together', '2 cones, point to point'],
    11: ['2 cones base together', '2 cones, base to base'],
    12: ['rhombus', 'rhombus (diamond)'],
    13: ['2 cones up', '2 cones (points upward)'],
    14: ['2 cones down', '2 cones (points downward)'],
    15: ['besom, point up', 'besom, point up (broom or perch)'],
    16: ['besom, point down', 'besom, point down (broom or perch)'],
    17: ['flag'],
    18: ['sphere over rhombus'],
    19: ['square'],
    20: ['rectangle, horizontal'],
    21: ['rectangle, vertical'],
    22: ['trapezium, up'],
    23: ['trapezium, down'],
    24: ['triangle, point up'],
    25: ['triangle, point down'],
    26: ['circle'],
    27: ['2 upright crosses', 'two upright crosses (one over the other)'],
    28: ['t-shape'],
    29: [
      'triangle, point up over circle',
      'triangle pointing up over a circle',
    ],
    30: ['upright cross over circle', 'upright cross over a circle'],
    31: ['rhombus over circle', 'rhombus over a circle'],
    32: [
      'circle over triangle, point up	',
      'circle over a triangle pointing up',
    ],
    33: ['other', 'other shape (see INFORM)'],
  },
};

type Cat = keyof typeof MAP;

// split the map above into a map with two entries for each item
const BIG_MAP = {} as Record<Cat, Record<string, string>>;
for (const attribute in MAP) {
  BIG_MAP[attribute as Cat] = {};
  const attributeMap = MAP[attribute as Cat];
  for (const enumIndex in attributeMap) {
    const [osmValue, ihoLongValue] =
      attributeMap[enumIndex as unknown as keyof typeof attributeMap];

    // create two entries for every one
    BIG_MAP[attribute as Cat][enumIndex] = osmValue;
    BIG_MAP[attribute as Cat][(ihoLongValue || osmValue).toLowerCase()] =
      osmValue;
  }
}

// @ts-expect-error -- TS is mad but it works
type OSMValuesFor<K extends Cat> = typeof MAP[K][keyof typeof MAP[K]][0];

/** maps an enum property from S57 to the osm seamark value */
export function MapCat<K extends Cat>(
  catName: K,
  S57value: string | undefined,
): OSMValuesFor<K> | undefined {
  if (!S57value) return undefined;

  const seamarkValue = BIG_MAP[catName][S57value.toLowerCase()];

  if (!seamarkValue) console.log(`Unknown value ${S57value} in ${catName}`);

  return seamarkValue as unknown as OSMValuesFor<K>;
}
