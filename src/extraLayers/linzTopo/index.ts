import { promises as fs } from 'fs';
import { join } from 'path';
import { GeoJsonFeature } from '../../types';
import { getT50IDsToSkip } from './getT50IDsToSkip';
import { csvToGeoJsonFactory } from './_specialLinzLayers';

const toTitleCase = (str: string) =>
  str.replace(
    /(^| )(\w)/g,
    (_, spaceOrEmpty, letter) => spaceOrEmpty + letter.toUpperCase(),
  );
const addSuffix = (str: string) =>
  str.toLowerCase().endsWith(' station') ? str : `${str} Station`;

/**
 * LINZ uses a weird system. I'm 99% sure this is correct
 * based on a test with the waterfalls and saddle layers
 */
const radToDeg = (radians: number): string =>
  `${(360 + 90 - Math.round((radians * 180) / Math.PI)) % 360}`;

export async function linzTopo(): Promise<void> {
  const IDsToSkip = await getT50IDsToSkip();
  const csvToGeoJson = csvToGeoJsonFactory(IDsToSkip);

  type CablewayCl = { t50_fid: string; mtlconveyd?: string };
  const goodsAerialway = await csvToGeoJson<CablewayCl>({
    input: 'cableway_industrial_cl.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        aerialway: 'goods',
        resource: data.mtlconveyd,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const cattleStops = await csvToGeoJson<{ t50_fid: string }>({
    input: 'cattlestop_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        barrier: 'cattle_grid',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const cutting = await csvToGeoJson<{ t50_fid: string }>({
    input: 'cutting_edge.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        man_made: 'embankment',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const dredgeTailing = await csvToGeoJson<{ t50_fid: string }>({
    input: 'dredge_tailing_cl.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        man_made: 'spoil_heap',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const waterRace = await csvToGeoJson<{
    t50_fid: string;
    name?: string;
    status?: 'disused';
  }>({
    input: 'water_race_cl.csv',
    idField: 't50_fid',
    sourceLayer: '50369',
    tagging(data) {
      return {
        waterway: 'ditch',
        name: data.name,
        disused: data.status === 'disused' ? 'yes' : undefined,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type FishMarineFarmPoly = {
    t50_fid: string;
    species?: string;
    type?: string;
  };
  const fishfarm = await csvToGeoJson<FishMarineFarmPoly>({
    input: 'fish_farm_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        landuse: 'aquaculture',
        produce: data.species || data.type,
        // TODO: also man_made=pier & floating=yes ?
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type FloodgatePnt = { t50_fid: string; orientatn: string };
  const floodgates = await csvToGeoJson<FloodgatePnt>({
    input: 'floodgate_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        waterway: 'floodgate',
        direction: radToDeg(+data.orientatn),
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type FordPnt = { t50_fid: string; name?: string };
  const fords = await csvToGeoJson<FordPnt>({
    input: 'ford_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        ford: 'yes',
        name: data.name, // only 1 of 1000 has a name
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const fumaroles = await csvToGeoJson<{ t50_fid: string }>({
    input: 'fumarole_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        natural: 'geyser',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type GatePnt = {
    t50_fid: string;
    name?: string;
    orientatn: string;
    restrictns?: 'locked';
  };
  const gates = await csvToGeoJson<GatePnt>({
    input: 'gate_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        barrier: 'gate',
        locked: data.restrictns === 'locked' ? 'yes' : 'no',
        name: data.name, // only 1 of 2500 has a name
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const gravelPits = await csvToGeoJson<{ t50_fid: string }>({
    input: 'gravel_pit_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        landuse: 'quarry',
        resource: 'gravel',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const marineFarmLines = await csvToGeoJson<FishMarineFarmPoly>({
    input: 'marine_farm_cl.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        landuse: 'aquaculture',
        produce: data.species || data.type,
        // TODO: also man_made=pier & floating=yes ?
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const marineFarmPolys = await csvToGeoJson<FishMarineFarmPoly>({
    input: 'marine_farm_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50298',
    tagging(data) {
      return {
        landuse: 'aquaculture',
        produce: data.species || data.type,
        // TODO: also man_made=pier & floating=yes ?
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const masts = await csvToGeoJson<{ t50_fid: string }>({
    input: 'mast_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        man_made: 'mast',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type Mine = {
    t50_fid: string;
    status?: 'disused';
    substance?: string;
    visibility: 'opencast' | 'underground';
    name?: string;
  };
  function mineTagging(data: Mine) {
    const obj: Record<string, string | undefined> = {
      disused: data.status === 'disused' ? 'yes' : undefined,
      resource: data.substance,
      name: data.name,
      'ref:linz:topo50_id': data.t50_fid,
    };

    // landuse=quarry is okay even on a node
    if (data.visibility === 'opencast') obj.landuse = 'quarry';
    else obj.man_made = 'mineshaft'; // TODO: mineshaft may not be correct

    return obj;
  }
  const minePts = await csvToGeoJson<Mine>({
    input: 'mine_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging: mineTagging,
  });
  const minePolys = await csvToGeoJson<Mine>({
    input: 'mine_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging: mineTagging,
  });

  type QuarryPoly = {
    t50_fid: string;
    status?: 'disused';
    substance?: string;
    name?: string;
  };
  const quarrys = await csvToGeoJson<QuarryPoly>({
    input: 'quarry_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        landuse: 'quarry', // landuse=quarry is okay even on a node
        disused: data.status === 'disused' ? 'yes' : undefined,
        resource: data.substance,
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type RaceTrackPoly = {
    t50_fid: string;
    name?: string;
    track_type?: string;
    track_use?: 'horse' | 'vehicle';
  };
  const racetracks = await csvToGeoJson<RaceTrackPoly>({
    input: 'racetrack_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        leisure: 'track',
        sport: data.track_use === 'vehicle' ? 'motor' : 'horse_racing',
        area: 'yes',
        name: data.name,
        note: data.track_type,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type Rapid = { t50_fid: string; name?: string };
  const rapidLines = await csvToGeoJson<Rapid>({
    input: 'rapid_cl.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        natural: 'water', // area tag, so mappers must convert to area
        waterway: 'rapids',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const rapidPolys = await csvToGeoJson<Rapid>({
    input: 'rapid_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        natural: 'water',
        waterway: 'rapids',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type RedoubtPnt = { t50_fid: string; name: string };
  const redoubts = await csvToGeoJson<RedoubtPnt>({
    input: 'redoubt_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50322',
    tagging(data) {
      return {
        name: data.name,
        historic: 'archaeological_site',
        site_type: 'fortification',
        // see https://wiki.openstreetmap.org/wiki/Key:historic:civilization#Māori and https://wiki.openstreetmap.org/wiki/Historic_Britain
        'historic:civilization': 'colonialism', // would pākehā find this tagging offensive?
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type RockOutcrop = {
    t50_fid: string;
    name?: string;
    elevation: string | '0'; // 0 means unknown
    orientatn: string;
  };
  const rockOutcrop = await csvToGeoJson<RockOutcrop>({
    input: 'rock_outcrop_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50322',
    tagging(data) {
      return {
        natural: 'rock', // TODO: discuss
        ele: data.elevation === '0' ? undefined : data.elevation,
        name: data.name,
        direction: radToDeg(+data.orientatn),
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type RunwayPoly = {
    t50_fid: string;
    name: string;
    surface?: 'sealed';
    runway_use: 'aerodrome' | 'airport' | 'airstrip';
  };
  const runways = await csvToGeoJson<RunwayPoly>({
    input: 'runway_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        name: data.name,
        aeroway: 'runway',
        area: 'yes',
        surface: data.surface === 'sealed' ? 'paved' : 'grass',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type SaddlePnt = {
    t50_fid: string;
    elevation: string | '0'; // 0 means unknown
    name?: string;
    orientatn: string;
  };
  const saddles = await csvToGeoJson<SaddlePnt>({
    input: 'saddle_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50334',
    tagging(data) {
      return {
        natural: 'saddle',
        ele: data.elevation === '0' ? undefined : data.elevation,
        name: data.name,
        direction: radToDeg(+data.orientatn),
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const showgrounds = await csvToGeoJson<{ t50_fid: string }>({
    input: 'showground_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        landuse: 'recreation_ground',
        recreation_ground: 'showground', // TODO: confirm/document?
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type SinkholePnt = { t50_fid: string };
  const sinkholes = await csvToGeoJson<SinkholePnt>({
    input: 'sinkhole_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50345',
    tagging(data) {
      return {
        natural: 'sinkhole',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const siphonPnts = await csvToGeoJson<{ t50_fid: string }>({
    input: 'siphon_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        // TODO: confirm
        // https://help.openstreetmap.org/questions/61943/how-to-tag-a-syphon
        layer: '-1',
        man_made: 'syphon', // TODO: document
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const siphonPolys = await csvToGeoJson<{ t50_fid: string }>({
    input: 'siphon_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50347',
    tagging(data) {
      return {
        // TODO: confirm
        // https://help.openstreetmap.org/questions/61943/how-to-tag-a-syphon
        layer: '-1',
        man_made: 'syphon', // TODO: document
        tunnel: 'culvert',
        waterway: 'canal',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const slipEdges = await csvToGeoJson<{ t50_fid: string }>({
    input: 'slip_edge.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        natural: 'cliff',
        hazard: 'landslide',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  // https://www.linz.govt.nz/crown-property/crown-pastoral-land
  type StationPoly = { id: string; lease_name: string };
  const stations = await csvToGeoJson<StationPoly>({
    input: 'south-island-pastoral-leases.csv',
    idField: 'id',
    sourceLayer: '51572',
    tagging(data) {
      return {
        landuse: 'farmland',
        farmland: 'station', // TODO: confirm/document?
        place: 'farm',
        name: toTitleCase(addSuffix(data.lease_name)),
        'ref:linz:pastoral_lease_id': data.id,
      };
    },
  });

  const spillwayEdges = await csvToGeoJson<{ t50_fid: string }>({
    input: 'spillway_edge.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        natural: 'water',
        water: 'canal',
        usage: 'spillway',
        intermittent: 'yes',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const towerPnts = await csvToGeoJson<{ t50_fid: string; material?: string }>({
    input: 'tower_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        man_made: 'tower',
        'tower:construction': data.material,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  //
  // Antarctic
  //
  // note that these features don't have a topo50_id
  //

  const A_crevasseCl = await csvToGeoJson<never>({
    input: 'antarctic_crevasse_cl.csv',
    idField: 'USE_ID',
    sourceLayer: '51161',
    tagging(_, index) {
      return {
        natural: 'crevasse',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_depformEdge = await csvToGeoJson<never>({
    input: 'antarctic_depform_edge.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        natural: 'cliff',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_descripText = await csvToGeoJson<{
    t50_fid: string;
    info_disp: string;
  }>({
    input: 'antarctic_descriptive_texts.csv',
    idField: 't50_fid',
    sourceLayer: '',
    tagging(data) {
      return {
        name: data.info_disp,
        // TODO: tagging
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const A_distIcePoly = await csvToGeoJson<never>({
    input: 'antarctic_distice_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_fastIcePoly = await csvToGeoJson<never>({
    input: 'antarctic_fastice_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_glacialLake = await csvToGeoJson<never>({
    input: 'antarctic_glacial_lake_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        natural: 'water',
        water: 'lake',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_cliffs = await csvToGeoJson<{ descriptn: string }>({
    input: 'antarctic_ice_cliff_edges.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        natural: 'cliff',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_icePoly = await csvToGeoJson<never>({
    input: 'antarctic_ice_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_iceStream = await csvToGeoJson<never>({
    input: 'antarctic_ice_stream_cl.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        waterway: 'stream',
        description: 'ice stream',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_iceberg = await csvToGeoJson<never>({
    input: 'antarctic_iceberg_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_lake = await csvToGeoJson<never>({
    input: 'antarctic_lake_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        natural: 'water',
        water: 'lake',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_meltStream = await csvToGeoJson<never>({
    input: 'antarctic_melt_stream_cl.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(_, index) {
      return {
        waterway: 'stream',
        description: 'melt stream',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  const A_scree = await csvToGeoJson<never>({
    input: 'antarctic_scree_poly.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(data, index) {
      return {
        natural: 'scree',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  type AntarcticTrack = {
    name?: string;
    track_type: 'poled route';
    track_use: 'vehicle' | 'foot';
  };
  const A_track = await csvToGeoJson<AntarcticTrack>({
    input: 'antarctic_track_cl.csv',
    idField: 'USE_ID',
    sourceLayer: '',
    tagging(data, index) {
      if (data.track_use === 'foot') {
        return {
          highway: 'path',
          'piste:type': 'hike',
          'piste:grooming': 'backcountry',
          source: 'LINZ',
          'ref:linz:temp_id': `${index}`,
        };
      }

      // else vehicle
      return {
        highway: 'track',
        ice_road: 'yes',
        source: 'LINZ',
        'ref:linz:temp_id': `${index}`,
      };
    },
  });

  /** see https://nz-facilities.readthedocs.io */
  type Facility = {
    facility_id?: string;
    source_facility_id?: string; // for schools, this is the MOE ID
    name: string;
    /** @deprecated */ source_name: string;
    use: 'School' | 'Hospital';
    use_type: string;
    use_subtype?: string;
    estimated_occupancy: string; // stringified number
    last_modified: string;
  };
  const facilities = await csvToGeoJson<Facility>({
    input: 'nz-facilities.csv',
    idField: 'facility_id',
    sourceLayer: '105588',
    tagging(data) {
      if (data.use === 'School') {
        return {
          amenity: 'school',
          name: data.name,
          // try to extract "Year x-y" and include only "x-y", otherwise use whole field
          grades: data.use_type.match(/Year (\d+-\d+)/)?.[1] || data.use_type,
          capacity: data.estimated_occupancy,
          'ref:nz:MOE': data.source_facility_id,
          'ref:linz:facility_id': data.facility_id,
        };
      }

      // else hospital
      return {
        amenity: 'hospital',
        healthcare: 'hospital',
        name: data.name,
        'operator:type':
          // eslint-disable-next-line no-nested-ternary
          data.use_type === 'Public Hospital'
            ? 'public'
            : data.use_type === 'NGO Hospital'
            ? 'private'
            : undefined,
        beds: data.estimated_occupancy,
        'healthcare:speciality': data.use_subtype
          ?.replace(/, /g, ';')
          .toLowerCase(),
        'ref:nz:MOH': data.source_facility_id, // this is the Health Provider Index (HPI) Facility Id (FACID)
        'ref:linz:facility_id': data.facility_id,
      };
    },
  });

  //
  // the first character of the name is significant:
  //   ❌ means it won't be published yet
  //   ZZ means it will be published but only visible to power users
  //   Z means it will be published
  //
  const out: Record<string, GeoJsonFeature[] | undefined> = {
    // Antarctic
    '❌ Antarctic Crevasse': A_crevasseCl,
    '❌ Antarctic Descriptive Text': A_descripText,
    '❌ Antarctic depFormEdge': A_depformEdge,
    '❌ Antarctic Land Ice': A_distIcePoly,
    '❌ Antarctic Sea Ice': A_fastIcePoly,
    '❌ Antarctic Glacial Lakes': A_glacialLake,
    '❌ Antarctic Cliffs': A_cliffs,
    '❌ Antarctic Ice': A_icePoly,
    '❌ Antarctic Icebergs': A_iceberg,
    '❌ Antarctic Ice Sreams': A_iceStream,
    'ZZ Antarctic Lakes': A_lake,
    '❌ Antarctic Melt Streams': A_meltStream,
    '❌ Antarctic Scree': A_scree,
    '❌ Antarctic Tracks & Paths': A_track,

    // Mainland
    '❌ Goods Aerialway': goodsAerialway,
    '❌ Cattle Stops': cattleStops,
    'Z Cutting': cutting,
    '❌ Dredge Tailing': dredgeTailing,
    '❌ Floodgates': floodgates,
    '❌ Fumaroles': fumaroles,
    '❌ Fords': fords,
    'Z Gates': gates,
    '❌ Gravel Pits': gravelPits,
    '❌ Marine & Fish Farm Areas': [
      ...(fishfarm || []),
      ...(marineFarmPolys || []),
    ],
    '❌ Marine Farm Lines': marineFarmLines,
    'Z Masts': masts,
    '❌ Mine Points': minePts,
    '❌ Mine Areas': minePolys,
    'Z Quarrys': quarrys,
    '❌ Racetracks': racetracks,
    '❌ Rapids (line)': rapidLines,
    '❌ Rapids (area)': rapidPolys,
    '❌ Runway Areas': runways,
    'Z Showgrounds': showgrounds,
    '❌ Landslide (slip)': slipEdges,
    '❌ Redoubt': redoubts,
    '❌ Pinnancle (rock outcrop)': rockOutcrop,
    '❌ Saddle': saddles,
    'ZZ Sinkholes': sinkholes,
    '❌ Spillways': spillwayEdges,
    'Z Towers': towerPnts,
    '❌ Siphons': [...(siphonPolys || []), ...(siphonPnts || [])],
    '❌ Stations': stations,
    '❌ Water Race': waterRace,

    '❌ Facilities': facilities,
  };

  for (const key in out) if (key.includes('❌')) delete out[key];

  await fs.writeFile(
    join(__dirname, `../../../data/extra-layers.geo.json`),
    JSON.stringify(out),
  );
}
