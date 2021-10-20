import { promises as fs } from 'fs';
import { join } from 'path';
import { ExtraLayers } from '../../types';
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
  console.log('Processing layers...');

  type CablewayCl = { t50_fid: string; mtlconveyd?: string };
  const goodsAerialway = await csvToGeoJson<CablewayCl>({
    input: 'cableway_industrial_cl.csv',
    idField: 't50_fid',
    sourceLayer: '50248',
    size: 'large',
    complete: true,
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
    sourceLayer: '50252',
    complete: true,
    size: 'large',
    tagging(data) {
      return {
        barrier: 'cattle_grid',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const cemeteries = await csvToGeoJson<{ t50_fid: string; name?: string }>({
    input: 'cemetery_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50254',
    size: 'large',
    complete: true,
    instructions: 'Do not import if already mapped as an area',
    tagging(data) {
      return {
        amenity: 'grave_yard',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const cutting = await csvToGeoJson<{ t50_fid: string }>({
    input: 'cutting_edge.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'large',
    instructions: "You may need to flip these if they're facing the wrong way",
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
    sourceLayer: '50264',
    size: 'large',
    complete: true,
    instructions: 'You MUST convert these to areas',
    tagging(data) {
      return {
        man_made: 'spoil_heap',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type Embankment = { t50_fid: string; embkmt_use?: 'stopbank' | 'causeway' };
  const embankment = await csvToGeoJson<Embankment>({
    input: 'embankment_cl.csv',
    idField: 't50_fid',
    sourceLayer: '50266',
    size: 'medium',
    instructions: "You may need to flip these if they're facing the wrong way",
    tagging(data) {
      // embkmt_use: 2288=stopbank, 95=causeway, 558=blank
      if (data.embkmt_use === 'causeway') {
        // this must be merged with a highway
        return {
          embankment: 'yes',
          'ref:linz:topo50_id': data.t50_fid,
        };
      }

      return {
        // long disucssion on gravitystorm/openstreetmap-carto#823
        // man_made=embankment is for the edges (both sides), man_made=dyke is for the centreline
        // inspite of this layer being called _cl (centreline), it it is more often the edge of a
        // one-sided embankment.

        // for embkmt_use=causeway we should use embankment=yes merged onto the way
        // for stopbank we should probably use man_made=dyke
        man_made: 'embankment',
        description: data.embkmt_use,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type WaterRaceCl = {
    t50_fid: string;
    name?: string;
    status?: 'disused';
  };
  const waterRace = await csvToGeoJson<WaterRaceCl>({
    input: 'water_race_cl.csv',
    idField: 't50_fid',
    sourceLayer: '50369',
    size: 'medium',
    dontFlipWays: true,
    tagging(data) {
      return {
        waterway: 'canal',
        usage: 'irrigation',
        description: 'water race',
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
    sourceLayer: '50270',
    size: 'large',
    tagging(data) {
      return {
        landuse: 'aquaculture',
        produce: data.species || data.type,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type FloodgatePnt = { t50_fid: string; orientatn: string };
  const floodgates = await csvToGeoJson<FloodgatePnt>({
    input: 'floodgate_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'large',
    instructions: 'You must merge with the waterway',
    complete: true,
    tagging(data) {
      return {
        waterway: 'sluice_gate',
        direction: radToDeg(+data.orientatn),
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type FordPnt = { t50_fid: string; name?: string };
  const fords = await csvToGeoJson<FordPnt>({
    input: 'ford_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50275',
    size: 'medium',
    instructions:
      "You must merge these nodes with the highway AND waterway if they're mapped",
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
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        natural: 'fumarole',
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
    size: 'medium',
    instructions: "You MUST merge these nodes with the highway if it's mapped",
    tagging(data) {
      return {
        barrier: 'gate',
        locked: data.restrictns === 'locked' ? 'yes' : 'no',
        name: data.name, // only 1 of 2500 has a name
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const golfCourses = await csvToGeoJson<{ t50_fid: string; name?: string }>({
    input: 'golf_course_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50281',
    complete: true,
    size: 'large',
    tagging(data) {
      return {
        leisure: 'golf_course',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const gravelPits = await csvToGeoJson<{ t50_fid: string }>({
    input: 'gravel_pit_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50283',
    size: 'large',
    tagging(data) {
      return {
        landuse: 'quarry',
        resource: 'gravel',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const landfillPoly = await csvToGeoJson<{ t50_fid: string; name: string }>({
    input: 'landfill_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        landuse: 'landfill',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const marineFarmLines = await csvToGeoJson<FishMarineFarmPoly>({
    input: 'marine_farm_cl.csv',
    idField: 't50_fid',
    sourceLayer: '50297',
    size: 'large',
    instructions: 'You must convert these to areas',
    complete: true,
    tagging(data) {
      return {
        landuse: 'aquaculture',
        produce: data.species || data.type,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const marineFarmPolys = await csvToGeoJson<FishMarineFarmPoly>({
    input: 'marine_farm_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50298',
    size: 'large',
    tagging(data) {
      return {
        landuse: 'aquaculture',
        produce: data.species || data.type,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type MastPnt = { t50_fid: string; height: string };
  const masts = await csvToGeoJson<MastPnt>({
    input: 'mast_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'medium',
    tagging(data) {
      return {
        man_made: 'mast',
        height: data.height === '0' ? undefined : data.height, // 0 means undefined
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
    size: 'large',
    complete: true,
    tagging: mineTagging,
  });
  const minePolys = await csvToGeoJson<Mine>({
    input: 'mine_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'large',
    tagging: mineTagging,
  });

  type Pond = {
    t50_fid: string;
    name?: string;
    pond_use?:
      | 'evaporation'
      | 'ice_skating'
      | 'oil'
      | 'oxidation'
      | 'settling'
      | 'sewage'
      | 'sewage treatment'
      | 'sludge';
  };
  const ponds = await csvToGeoJson<Pond>({
    input: 'pond_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50310',
    size: 'medium',
    tagging(data) {
      return {
        natural: 'water',
        water: data.pond_use ? 'basin' : 'pond',
        basin: data.pond_use,
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
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
    size: 'large',
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
    size: 'large',
    complete: true,
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
    instructions: 'You must convert these to areas',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        natural: 'water',
        water: 'rapids',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const rapidPolys = await csvToGeoJson<Rapid>({
    input: 'rapid_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        natural: 'water',
        water: 'rapids',
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
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        name: data.name,
        historic: 'archaeological_site',
        site_type: 'fortification',
        'historic:civilization': 'colonialism',
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
    size: 'medium',
    complete: true,
    tagging(data) {
      return {
        natural: 'rock',
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
    size: 'medium',
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
    size: 'large',
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

  const shelterBelt = await csvToGeoJson<{ t50_fid: string }>({
    input: 'shelter_belt_cl.csv',
    idField: 't50_fid',
    sourceLayer: '50341',
    size: 'small',
    tagging(data) {
      return {
        natural: 'tree_row',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const showgrounds = await csvToGeoJson<{ t50_fid: string }>({
    input: 'showground_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        landuse: 'recreation_ground',
        recreation_ground: 'showground',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  type SinkholePnt = { t50_fid: string };
  const sinkholes = await csvToGeoJson<SinkholePnt>({
    input: 'sinkhole_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50345',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        natural: 'sinkhole',
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  function siphonTagging() {
    // discussions on the tagging mailing list weren't able to decide on a tag
    // culvert=inverted_siphon is in use and was the only suggestion on the mailing list
    // https://lists.openstreetmap.org/pipermail/tagging/2021-September/thread.html
    // https://help.osm.org/questions/61943
    return {
      waterway: 'canal',
      layer: '-1',
      tunnel: 'culvert',
      culvert: 'inverted_siphon',
      description: 'siphon',
    };
  }
  const siphonPnts = await csvToGeoJson<{ t50_fid: string }>({
    input: 'siphon_pnt.csv',
    idField: 't50_fid',
    sourceLayer: '50346',
    size: 'large',
    instructions:
      'Nodes and Areas must be converted to ways (part of the canal)',
    complete: true,
    tagging(data) {
      return {
        ...siphonTagging(),
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const siphonPolys = await csvToGeoJson<{ t50_fid: string }>({
    input: 'siphon_poly.csv',
    idField: 't50_fid',
    sourceLayer: '50347',
    size: 'large',
    instructions:
      'Nodes and Areas must be converted to ways (part of the canal)',
    complete: true,
    tagging(data) {
      return {
        ...siphonTagging(),
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const slipEdges = await csvToGeoJson<{ t50_fid: string }>({
    input: 'slip_edge.csv',
    idField: 't50_fid',
    sourceLayer: '50350',
    size: 'medium',
    instructions:
      'merging this layer with existing data is very tedious in some regions',
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
    size: 'small',
    tagging(data) {
      return {
        landuse: 'meadow',
        meadow: 'pasture',
        place: 'farm',
        name: toTitleCase(addSuffix(data.lease_name)),
        'ref:linz:pastoral_lease_id': data.id,
      };
    },
  });

  const spillwayEdges = await csvToGeoJson<{ t50_fid: string }>({
    input: 'spillway_edge.csv',
    idField: 't50_fid',
    sourceLayer: '50354',
    instructions: 'You must convert these to areas',
    complete: true,
    size: 'large',
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
    sourceLayer: '50363',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        man_made: 'tower',
        material: data.material,
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
    idField: 'HASH_WKT',
    sourceLayer: '51161',
    size: 'large',
    complete: true,
    tagging(_, wktHash) {
      return {
        natural: 'crevasse',
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_depformEdge = await csvToGeoJson<never>({
    input: 'antarctic_depform_edge.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(_, wktHash) {
      return {
        natural: 'cliff',
        'ref:linz:topo50_id': wktHash,
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
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        name: data.info_disp,
        tourism: 'attraction', // mappers must decide the tagging for each one
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });

  const A_glacialLake = await csvToGeoJson<never>({
    input: 'antarctic_glacial_lake_poly.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(_, wktHash) {
      return {
        natural: 'water',
        water: 'lake',
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_heightPnt = await csvToGeoJson<{ elevation: string }>({
    input: 'antarctic_height_pnt.csv',
    idField: 'HASH_WKT',
    sourceLayer: '51163',
    size: 'large',
    complete: true,
    tagging(data, wktHash) {
      return {
        natural: 'hill',
        ele: data.elevation,
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_iceCliffs = await csvToGeoJson<never>({
    input: 'antarctic_ice_cliff_edges.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(_, wktHash) {
      return {
        natural: 'cliff',
        surface: 'ice',
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_icePoly = await csvToGeoJson<never>({
    input: 'antarctic_ice_poly.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    complete: true,
    size: 'large',
    tagging(_, wktHash) {
      return {
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_iceStream = await csvToGeoJson<never>({
    input: 'antarctic_ice_stream_cl.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    dontFlipWays: true,
    complete: true,
    tagging(_, wktHash) {
      return {
        waterway: 'stream',
        description: 'ice stream',
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_lake = await csvToGeoJson<never>({
    input: 'antarctic_lake_poly.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(_, wktHash) {
      return {
        natural: 'water',
        water: 'lake',
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_meltStream = await csvToGeoJson<never>({
    input: 'antarctic_melt_stream_cl.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    dontFlipWays: true,
    complete: true,
    tagging(_, wktHash) {
      return {
        waterway: 'stream',
        description: 'melt stream',
        'ref:linz:topo50_id': wktHash,
      };
    },
  });

  const A_scree = await csvToGeoJson<never>({
    input: 'antarctic_scree_poly.csv',
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(_, wktHash) {
      return {
        natural: 'scree',
        'ref:linz:topo50_id': wktHash,
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
    idField: 'HASH_WKT',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging(data, wktHash) {
      if (data.track_use === 'foot') {
        return {
          highway: 'path',
          'piste:type': 'hike',
          'piste:grooming': 'backcountry',
          'ref:linz:topo50_id': wktHash,
        };
      }

      // else vehicle
      return {
        highway: 'track',
        ice_road: 'yes',
        'ref:linz:topo50_id': wktHash,
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
    size: 'large',
    tagging(data) {
      if (data.use === 'School') {
        return {
          amenity: 'school',
          name: data.name,
          // try to extract "Year x-y" and include only "x-y", otherwise use whole field
          grades: data.use_type.match(/Year (\d+-\d+)/)?.[1] || data.use_type,
          capacity: data.estimated_occupancy,
          ref: data.source_facility_id,
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
        ref: data.source_facility_id, // this is the Health Provider wktHash (HPI) Facility Id (FACID)
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
  const out: ExtraLayers = {
    // Antarctic
    'Z Antarctic Crevasse': A_crevasseCl,
    'Z Antarctic Ice Cliffs': A_iceCliffs,
    'Z Antarctic Descriptive Text': A_descripText,
    'Z Antarctic depFormEdge': A_depformEdge,
    'Z Antarctic Glacial Lakes': A_glacialLake,
    'Z Antarctic Hills': A_heightPnt,
    'Z Antarctic Ice': A_icePoly,
    'Z Antarctic Ice Streams': A_iceStream,
    'Z Antarctic Lakes': A_lake,
    'Z Antarctic Melt Streams': A_meltStream,
    'Z Antarctic Scree': A_scree,
    'Z Antarctic Tracks & Paths': A_track,

    // Mainland
    'Z Goods Aerialways': goodsAerialway,
    'Z Cattle Stops': cattleStops,
    'Z Cemeteries': cemeteries,
    'Z Cuttings': cutting,
    'Z Dredge Tailing': dredgeTailing,
    'ZZ Embankments': embankment,
    'Z Floodgates': floodgates,
    'Z Fumaroles': fumaroles,
    'Z Fords': fords,
    'Z Gates': gates,
    'Z Golf Courses': golfCourses,
    'Z Gravel Pits': gravelPits,
    'Z Landfills': landfillPoly,
    'Z Marine Farm Areas': {
      ...fishfarm,
      features: [...fishfarm.features, ...marineFarmPolys.features],
    },
    'Z Marine Farm Lines': marineFarmLines,
    'Z Masts': masts,
    'Z Mine Points': minePts,
    'Z Mine Areas': minePolys,
    'Z Ponds': ponds,
    'Z Quarrys': quarrys,
    'Z Racetracks': racetracks,
    'Z Rapids (line)': rapidLines,
    'Z Rapids (area)': rapidPolys,
    'Z Runway Areas': runways,
    'Z Showgrounds': showgrounds,
    'Z Landslides': slipEdges,
    'Z Redoubts': redoubts,
    'Z Pinnacles': rockOutcrop,
    'Z Saddles': saddles,
    'Z Tree Rows': shelterBelt,
    'Z Sinkholes': sinkholes,
    'Z Spillways': spillwayEdges,
    'Z Towers': towerPnts,
    'Z Siphons': {
      ...siphonPnts,
      features: [...siphonPolys.features, ...siphonPnts.features],
    },
    'ZZ Stations': stations,
    'Z Water Races': waterRace,

    '❌ Facilities': facilities,
  };

  for (const key in out) {
    if (key.includes('❌') || !out[key].features.length) delete out[key];
  }

  await fs.writeFile(
    join(__dirname, `../../../data/extra-layers.geo.json`),
    JSON.stringify(out),
  );
}
