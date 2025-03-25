/**
 * See https://www.doc.govt.nz/about-us/our-role/managing-conservation/categories-of-conservation-land/
 *
 * The order of this object is the same as https://en.wikipedia.org/wiki/Protected_areas_of_New_Zealand
 *
 * The mapping between NZ's classification and the IUCN is
 * based on this 2023 report from the Ministry for the Environment:
 * https://environment.govt.nz/assets/publications/land/Protected-Areas-Network-of-NZ-report.pdf
 */
export const PROTECT_CLASS = {
  S4_NATIONAL_PARK: ['National Park', 'Q46169', '2'],
  S127_3_PROTECTED_AS_A_NATIONAL_PARK: ['National Park', 'Q46169', '2'],
  S128_1_B_PROTECTED_AS_A_NATIONAL_PARK: ['National Park', 'Q46169', '2'],
  S3_MARINE_RESERVE: ['Marine Reserve', 'Q1846270', '1a'],

  S13_NATIONAL_RESERVE: ['National Reserve', 'Q6978070', '2'],
  '17_RECREATION_RESERVE': ['Recreation Reserve', 'Q112161186', '5'],
  S18_HISTORIC_RESERVE: ['Historic Reserve', 'Q112161119', '3'],
  S19_1_A_SCENIC_RESERVE: ['Scenic Reserve', 'Q63248569', '3'],
  S19_1_B_SCENIC_RESERVE: ['Scenic Reserve', 'Q63248569', '3'],
  S20_NATURE_RESERVE: ['Nature Reserve', 'Q113561028', '1a'],
  S21_SCIENTIFIC_RESERVE: ['Scientific Reserve', 'Q113561096', '1a'],
  S22_GOVERNMENT_PURPOSE_RESERVE: [
    'Government Purpose Reserve',
    'Q112136688',
    '4',
  ],
  S23_LOCAL_PURPOSE_RESERVE: ['Local Purpose Reserve', 'Q113576158', '5'],
  '20_WILDERNESS_AREA': ['Wilderness Area', 'Q2445527', '1b'],
  S14_WILDERNESS_AREA: ['Wilderness Area', 'Q2445527', '1b'],
  S_47_WILDERNESS_AREA: ['Wilderness Area', 'Q2445527', '1b'],

  S19_CONSERVATION_PARK: ['Conservation Park', 'Q5162994', '2'],
  S21_ECOLOGICAL_AREA: ['Ecological Area', 'Q112136526', '1a'],
  S22_SANCTUARY_AREA: ['Sanctuary Area', 'Q112136448', '1a'],
  S_23_WATERCOURSE_AREA: ['Watercourse Area', 'Q113588180', '4'],
  S23A_AMENITY_AREA: ['Amenity Area', 'Q112160795', '7'],
  S15_AMENITIES_AREA: ['Amenity Area', 'Q112160795', '7'],
  S23B_WILDLIFE_MANAGEMENT_AREA: ['Wildlife Management Area', 'Q8001309', '4'],
  S14A_WILDLIFE_MANAGEMENT_RESERVE: [
    'Wildlife Management Area',
    'Q8001309',
    '4',
  ],

  S24_3_FIXED_MARGINAL_STRIP: ['Marginal Strip', 'Q130348775', '6'],
  S24_1_2_MOVEABLE_MARGINAL_STRIP: ['Marginal Strip', 'Q130348775', '6'],
  S25_STEWARDSHIP_AREA: ['Stewardship Area', 'Q106571205', '4'],

  RAMSAR_CONVENTION_WETLANDS_INTERNATIONAL_IMPORTANCE: [
    'Ramsar Site',
    'Q19683138',
    '98',
  ],
  WORLD_HERITAGE_LISTING: ['World Heritage Site', 'Q9259', '98'],

  // Listed in the Ministry for the Environment report, but not on Wikipedia:
  S12_SPECIALLY_PROTECTED_AREA: ['Specially Protected Area', '', '1a'],
  S9_WILDLIFE_SANCTUARY: ['Wildlife Sanctuary', 'Q8946564', '1a'],
  S22_MARINE_MAMMALS_SANCTUARY: ['Marine Mammal Sanctuary', 'Q130516999', '1a'],
  S33_ESTABLISHMENT_OF_HAURAKI_GULF_MARINE_PARK: [
    'Marine Park',
    'Q1185274',
    '1a',
  ],
  '27_CONSERVATION_COVENANT': ['Conservation Covenant', 'Q3480552', '4'],
  S_18_WILDLIFE_REFUGE: ['Wildlife Refuge', 'Q1377575', '4'],
  S14_WILDLIFE_REFUGE: ['Wildlife Refuge', 'Q1377575', '4'],

  // other (large number of features):
  SCH4_LAND_TO_WHICH_ACCESS_RESTRICTIONS_APPLY: undefined,
  S7_CONSERVATION_PURPOSES: undefined,

  // other (small number of features):
  S58_WHENUA_RAHUI: undefined,
  S126_RUATIKURI: undefined,
  '27A_NGA_WHENUA_RAHUI_KAWENATA': undefined,
  S60_ADMINISTRATION_PURPOSE: undefined,
  S29_MANAGEMENT_AGREEMENT: undefined,
  S26ZS_DOG_AREA: undefined,
  S18_PROTECTIVE_COVENANT: undefined,
  '68_FRESHWATER_FISHERIES_REGULATIONS': undefined,
  WALKWAY: undefined,
  S176_1_A_UNOCCUPIED_CROWN_LAND: undefined,
  S11_COMMON_MARINE_COASTAL_AREA: undefined,
  '59_UUKAIPOO': undefined,
  S86_TOOPUNI: undefined,
  '259_NOHOANGA_ENTITLEMENT_LAND': undefined,
  SCHEDULES_STATUTORY_AREAS: undefined,
  SCHEDULES_80_93_TOPUNI: undefined,
  S92_NOHOANGA_ENTITLEMENT_LAND: undefined,
  S65_NOHOANGA: undefined,
  S72_TAIKI_POIPOIA: undefined,
  S46_UKAIPO: undefined,
  S75_NOHOANHA_ENTITLEMENT_LAND: undefined,
  S38_CONTROL_MANAGEMENT_NON_RESERVE: undefined,
  S76_PROTECTED_PRIVATE_LAND: undefined,
  S77_CONSERVATION_COVENANT: undefined,
  S16_11_RECREATION_RESERVE_RACECOURSE: undefined,
  S77A_NGA_WHENUA_RAHUI_KAWENATA: undefined,
  S50_TE_TAREHU: undefined,
  S40_KIRIHIPI: undefined,
  S76_NOHOANGA_ENTITLEMENT_LAND: undefined,
  S2_WAITANGI_ENDOWMENT_FOREST: undefined,
  S4_24_31_WALKWAY: undefined,
  '27_RECREATIONAL_HUNTING_AREA': undefined,
  S_191_CONSERVATION_VALUES: undefined,
  S_191_RESERVE_SECONDARY_USE: undefined,
  S_34_STATEMENT_JOINT_ASPIRATIONS: undefined,
  S11_TE_ROHE_O_TE_WHANAU_PUHA_WHALE_SANCTUARY: undefined,
  S9_2_LAND_HELD_FOR_NATIONAL_PARK_PURPOSES: undefined,
  S130_TAWHIUAU_MAUNGA: undefined,
  S12_TE_UREWERA: undefined,
  SCHEDULE_4_MATAITAI_RESERVES_TAIAPURE_LOCAL_FISHERIES: undefined,
  S18_SPECIALLY_PROTECTED_AREA: undefined,
  SCHEDULE_1_KAIKOURA_MARINE_AREA: undefined,
  S52_1_D_LAND_HELD_FOR_GOVT_WORK_REQUIRED_FOR_ANOTHER_GOVT_WORK: undefined,
  S52_BOARD_MAY_ALIENATE_CROWN_LAND: undefined,
  S12_OHAU_NEW_ZEALAND_FUR_SEAL_SANCTUARY: undefined,
  '': undefined,
} satisfies Record<
  string,
  [title: string, qId: string, iucnCategory: string] | undefined
>;

export type ProtectClass = keyof typeof PROTECT_CLASS;
