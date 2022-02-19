import { promises as fs } from 'fs';
import { join } from 'path';
import { ExtraLayers } from '../../types';
import { getT50IDsToSkip } from './getT50IDsToSkip';
import {
  seamarkTagging,
  Seamark,
  readNauticalChartIndexCsv,
  mergeMaritimeLights,
} from './seamarkTagging';
import { transformAirstrip } from './geoOperations';
import { csvToGeoJsonFactory } from './_specialLinzLayers';

const TODAY = new Date();

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

  const charts = await readNauticalChartIndexCsv();
  await fs.writeFile(
    join(__dirname, '../../../data/nautical-index.json'),
    JSON.stringify(charts, null, 2),
  );

  const csvToGeoJson = csvToGeoJsonFactory(IDsToSkip, charts);
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
    complete: true,
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
    size: 'small',
    complete: true,
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
        waterway: 'ditch',
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
    complete: true,
    tagging(data) {
      return {
        landuse: 'aquaculture',
        'seamark:type': 'marine_farm',
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
    complete: true,
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
    complete: true,
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
        'seamark:type': 'marine_farm',
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
    complete: true,
    tagging(data) {
      return {
        landuse: 'aquaculture',
        'seamark:type': 'marine_farm',
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
    complete: true,
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
    complete: true,
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
  const quarries = await csvToGeoJson<QuarryPoly>({
    input: 'quarry_poly.csv',
    idField: 't50_fid',
    sourceLayer: '',
    size: 'medium',
    complete: true,
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
    transformGeometry: transformAirstrip,
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
    complete: true,
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
    complete: true,
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
    complete: true,
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
  // Geo Names
  // see https://docs.topo.linz.govt.nz/data-dictionary/tdd-class-geographic_name.html
  //
  type GeoName = { t50_fid: string; name?: string };
  // generate these files from the geo_name file using: (for WHF)
  // `head geo_src.csv -n 1 > geo_WHF.csv && cat geo_src.csv | grep ,WHF, >> geo_WHF.csv`
  const geoNamesInstructions =
    'These features are nodes, but they should be merged with any existing areas. Many are already mapped in OSM.';

  const namedBridges = await csvToGeoJson<GeoName>({
    input: 'geo_BDGE.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: geoNamesInstructions,
    complete: true,
    tagging(data) {
      return {
        man_made: 'bridge',
        layer: '1',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedCemeteries = await csvToGeoJson<GeoName>({
    input: 'geo_CEM.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        amenity: 'grave_yard',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedFarms = await csvToGeoJson<GeoName>({
    input: 'geo_FARM.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        place: 'farm',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const homesteads = await csvToGeoJson<GeoName>({
    input: 'geo_HSTD.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'medium',
    instructions: geoNamesInstructions,
    tagging(data) {
      return {
        building: 'farm',
        description: 'homestead',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedHuts = await csvToGeoJson<GeoName>({
    input: 'geo_HUT.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'medium',
    complete: true,
    instructions: geoNamesInstructions,
    tagging(data) {
      return {
        building: 'hut',
        tourism: 'wilderness_hut',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedLights = await csvToGeoJson<GeoName>({
    input: 'geo_LTH.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        'seamark:type': 'light_major',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedCampSites = await csvToGeoJson<GeoName>({
    input: 'geo_MCUL.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: geoNamesInstructions,
    complete: true,
    tagging(data) {
      if (data.name?.toLowerCase().includes(' camp')) {
        return {
          tourism: 'camp_site',
          name: data.name,
          'ref:linz:topo50_id': data.t50_fid,
        };
      }
      return null; // see MCUL below
    },
  });
  const namedMiscCulturalSite = await csvToGeoJson<GeoName>({
    input: 'geo_MCUL.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: 'You need to choose the tagging for each one',
    complete: true,
    tagging(data) {
      if (data.name?.toLowerCase().includes(' camp')) return null; // see MCUL above

      return {
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedMine = await csvToGeoJson<GeoName>({
    input: 'geo_MINE.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: geoNamesInstructions,
    complete: true,
    tagging(data) {
      return {
        landuse: 'quarry',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const pāOrMarae = await csvToGeoJson<GeoName>({
    input: 'geo_PA.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      const maraeTags = { amenity: 'marae' };
      const paTags = { historic: 'pa', site_type: 'fortification' };
      return {
        // this is an unreliable check, so mappers will need to confirm each one
        ...(data.name?.toLowerCase().includes('marae') ? maraeTags : paTags),
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedParks = await csvToGeoJson<GeoName>({
    input: 'geo_PARK.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: geoNamesInstructions,
    complete: true, // won't import, better to use areas/boundaries from another dataset
    tagging(data) {
      return {
        leisure: 'park',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedPipelines = await csvToGeoJson<GeoName>({
    input: 'geo_PPLN.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        man_made: 'pipeline',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedRoadRelatedFeature = await csvToGeoJson<GeoName>({
    input: 'geo_RDRF.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: 'Some of these may not be junctions',
    complete: true,
    tagging(data) {
      return {
        junction: 'yes',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedTunnel = await csvToGeoJson<GeoName>({
    input: 'geo_TUNL.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    instructions: geoNamesInstructions,
    complete: true,
    tagging(data) {
      return {
        man_made: 'tunnel',
        layer: '-1',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedOilWell = await csvToGeoJson<GeoName>({
    input: 'geo_WELL.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        man_made: 'petroleum_well',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedWharf = await csvToGeoJson<GeoName>({
    input: 'geo_WHF.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        man_made: 'pier',
        name: data.name,
        'ref:linz:topo50_id': data.t50_fid,
      };
    },
  });
  const namedShipwreck = await csvToGeoJson<GeoName>({
    input: 'geo_WRCK.csv',
    idField: 't50_fid',
    sourceLayer: '50280',
    size: 'large',
    complete: true,
    tagging(data) {
      return {
        historic: 'wreck',
        'seamark:type': 'wreck',
        'wreck:type': 'ship',
        name: data.name,
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

  //
  // Hydrographic
  //
  const maritimeLinearInstructions =
    'Sometimes there are multiple features on top of each other. Be careful not to add duplicate data.';

  const H_anchorBerths = await csvToGeoJson<Seamark['anchor_berth']>({
    input: [
      'sea/anchor-berth-points-hydro-122k-190k.csv',
      'sea/anchor-berth-points-hydro-14k-122k.csv',
      'sea/anchor-berth-points-hydro-190k-1350k.csv',
      'sea/anchor-berth-polygons-hydro-122k-190k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('anchor_berth'),
  });

  const H_anchorages = await csvToGeoJson<Seamark['anchorage']>({
    input: [
      'sea/anchorage-area-points-hydro-122k-190k.csv',
      'sea/anchorage-area-points-hydro-14k-122k.csv',
      'sea/anchorage-area-points-hydro-190k-1350k.csv',
      'sea/anchorage-area-polygons-hydro-122k-190k.csv',
      'sea/anchorage-area-polygons-hydro-14k-122k.csv',
      'sea/anchorage-area-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('anchorage'),
  });

  const H_berths = await csvToGeoJson<Seamark['berth']>({
    input: ['sea/berth-points-hydro-14k-122k.csv'],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('berth'),
  });

  const H_submarineCables = await csvToGeoJson<Seamark['cable_submarine']>({
    input: [
      'sea/cable-submarine-polyline-hydro-14k-122k.csv',
      'sea/cable-submarine-polyline-hydro-122k-190k.csv',
      'sea/cable-submarine-polyline-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    instructions: maritimeLinearInstructions,
    complete: true,
    tagging: seamarkTagging('cable_submarine'),
  });

  const H_daymarks = await csvToGeoJson<Seamark['daymark']>({
    input: [
      'sea/daymark-points-hydro-115mil-and-smaller.csv',
      'sea/daymark-points-hydro-122k-190k.csv',
      'sea/daymark-points-hydro-14k-122k.csv',
      'sea/daymark-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('daymark'),
  });

  const H_dumpingGrounds = await csvToGeoJson<Seamark['dumping_ground']>({
    input: [
      'sea/dumping-ground-points-hydro-14k-122k.csv',
      'sea/dumping-ground-polygons-hydro-14k-122k.csv',
      'sea/dumping-ground-polygons-hydro-122k-190k.csv',
      'sea/dumping-ground-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('dumping_ground'),
  });

  const H_fishingFacs = await csvToGeoJson<Seamark['fishing_facility']>({
    input: [
      'sea/fishing-facility-points-hydro-122k-190k.csv',
      'sea/fishing-facility-polyline-hydro-122k-190k.csv',
      'sea/fishing-facility-polyline-hydro-14k-122k.csv',
      'sea/fishing-facility-polyline-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('fishing_facility'),
  });

  const H_fogSignals = await csvToGeoJson<Seamark['fog_signal']>({
    input: [
      'sea/fog-signal-points-hydro-115mil-and-smaller.csv',
      'sea/fog-signal-points-hydro-122k-190k.csv',
      'sea/fog-signal-points-hydro-1350k-11500k.csv',
      'sea/fog-signal-points-hydro-14k-122k.csv',
      'sea/fog-signal-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('fog_signal'),
  });

  const H_hulk = await csvToGeoJson<Seamark['hulk']>({
    input: [
      'sea/hulk-points-hydro-122k-190k.csv',
      'sea/hulk-points-hydro-14k-122k.csv',
      'sea/hulk-points-hydro-190k-1350k.csv',
      'sea/hulk-polygons-hydro-122k-190k.csv',
      'sea/hulk-polygons-hydro-14k-122k.csv',
      'sea/hulk-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('hulk'),
  });

  const H_lights = await csvToGeoJson<Seamark['light']>({
    input: [
      'sea/light-points-hydro-115mil-and-smaller.csv',
      'sea/light-points-hydro-122k-190k.csv',
      'sea/light-points-hydro-1350k-11500k.csv',
      'sea/light-points-hydro-190k-1350k.csv',
      'sea/light-points-hydro-14k-122k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    instructions:
      'MOST LIGHTS ARE ALREADY IMPORTED FROM THE US NGA IMPORT. This is a tricky layer that requires manual conflation',
    complete: true,
    tagging: seamarkTagging('light'),
  }).then(mergeMaritimeLights);

  const H_pipelines = await csvToGeoJson<Seamark['pipeline_submarine']>({
    input: [
      'sea/pipeline-submarine-on-land-points-hydro-14k-122k.csv',
      'sea/pipeline-submarine-on-land-polyline-hydro-14k-122k.csv',
      'sea/pipeline-submarine-on-land-polyline-hydro-122k-190k.csv',
      'sea/pipeline-submarine-on-land-polyline-hydro-190k-1350k.csv',
      'sea/pipeline-submarine-on-land-polyline-hydro-1350k-11500k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    instructions: maritimeLinearInstructions,
    complete: true,
    tagging: seamarkTagging('pipeline_submarine'),
  });

  const H_mooring = await csvToGeoJson<Seamark['mooring']>({
    input: [
      'sea/mooring-warping-facility-points-hydro-122k-190k.csv',
      'sea/mooring-warping-facility-points-hydro-1350k-11500k.csv',
      'sea/mooring-warping-facility-points-hydro-14k-122k.csv',
      'sea/mooring-warping-facility-points-hydro-190k-1350k.csv',
      'sea/mooring-warping-facility-polygons-hydro-14k-122k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('mooring'),
  });

  const H_oilRigs = await csvToGeoJson<Seamark['platform']>({
    input: 'sea/offshore-platform-points-hydro-190k-1350k.csv',
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('platform'),
  });

  const H_piles = await csvToGeoJson<Seamark['pile']>({
    input: [
      'sea/pile-points-hydro-122k-190k.csv',
      'sea/pile-points-hydro-14k-122k.csv',
      'sea/pile-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('pile'),
  });

  const H_recommendedTrack = await csvToGeoJson<Seamark['recommended_track']>({
    input: [
      'sea/recommended-track-polyline-hydro-14k-122k.csv',
      'sea/recommended-track-polyline-hydro-122k-190k.csv',
      'sea/recommended-track-polyline-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    instructions: `${maritimeLinearInstructions}\n\nMake sure you import navigation lines FIRST,
      then do this. Delete the navigation lines where they overlap with recommended tracks`,
    complete: true,
    tagging: seamarkTagging('recommended_track'),
  });

  const H_navigationLine = await csvToGeoJson<Seamark['navigation_line']>({
    input: [
      'sea/navigation-line-polyline-hydro-14k-122k.csv',
      'sea/navigation-line-polyline-hydro-122k-190k.csv',
      'sea/navigation-line-polyline-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    instructions: `${maritimeLinearInstructions}\n\nNavigation lines should not overlap with recommended tracks`,
    complete: true,
    tagging: seamarkTagging('navigation_line'),
  });

  const H_pontoons = await csvToGeoJson<Seamark['pontoon']>({
    input: [
      'sea/pontoon-polygons-hydro-14k-122k.csv',
      'sea/pontoon-polyline-hydro-14k-122k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('pontoon'),
  });

  const H_pylons = await csvToGeoJson<Seamark['pylon']>({
    input: [
      'sea/pylon-bridge-support-points-hydro-122k-190k.csv',
      'sea/pylon-bridge-support-points-hydro-14k-122k.csv',
      'sea/pylon-bridge-support-points-hydro-190k-1350k.csv',
      'sea/pylon-bridge-support-polygons-hydro-14k-122k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('pylon'),
  });

  const H_radarStations = await csvToGeoJson<Seamark['radar_station']>({
    input: [
      'sea/radar-station-points-hydro-122k-190k.csv',
      'sea/radar-station-points-hydro-14k-122k.csv',
      'sea/radar-station-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('radar_station'),
  });

  const H_radarTransponder = await csvToGeoJson<Seamark['radar_transponder']>({
    input: [
      'sea/radar-transponder-beacon-points-hydro-1350k-11500k.csv',
      'sea/radar-transponder-beacon-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('radar_transponder'),
  });

  const H_rescueStations = await csvToGeoJson<Seamark['rescue_station']>({
    input: [
      'sea/rescue-station-points-hydro-122k-190k.csv',
      'sea/rescue-station-points-hydro-14k-122k.csv',
      'sea/rescue-station-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('rescue_station'),
  });

  const H_sandWaves = await csvToGeoJson<Seamark['sand_waves']>({
    input: [
      'sea/sand-waves-points-hydro-122k-190k.csv',
      'sea/sand-waves-points-hydro-14k-122k.csv',
      'sea/sand-waves-points-hydro-190k-1350k.csv',
      'sea/sand-waves-polygons-hydro-122k-190k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('sand_waves'),
  });

  const H_seaplaneRunways = await csvToGeoJson<
    Seamark['seaplane_landing_area']
  >({
    input: [
      'sea/sea-plane-landing-area-points-hydro-14k-122k.csv',
      'sea/sea-plane-landing-area-polygons-hydro-122k-190k.csv',
      'sea/sea-plane-landing-area-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('seaplane_landing_area'),
  });

  const H_springs = await csvToGeoJson<Seamark['spring']>({
    input: [
      'sea/spring-points-hydro-122k-190k.csv',
      'sea/spring-points-hydro-1350k-11500k.csv',
      'sea/spring-points-hydro-14k-122k.csv',
      'sea/spring-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('spring'),
  });

  const H_topmarks = await csvToGeoJson<Seamark['topmark']>({
    input: [
      'sea/topmark-points-hydro-115mil-and-smaller.csv',
      'sea/topmark-points-hydro-122k-190k.csv',
      'sea/topmark-points-hydro-1350k-11500k.csv',
      'sea/topmark-points-hydro-14k-122k.csv',
      'sea/topmark-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('topmark'),
  });

  const H_subseaRocks = await csvToGeoJson<Seamark['rock']>({
    input: [
      'sea/underwater-awash-rock-points-hydro-115mil-and-smaller.csv',
      'sea/underwater-awash-rock-points-hydro-122k-190k.csv',
      'sea/underwater-awash-rock-points-hydro-1350k-11500k.csv',
      'sea/underwater-awash-rock-points-hydro-14k-122k.csv',
      'sea/underwater-awash-rock-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('rock'),
  });

  const H_weeds = await csvToGeoJson<Seamark['weed']>({
    input: [
      'sea/weed-kelp-points-hydro-122k-190k.csv',
      'sea/weed-kelp-points-hydro-14k-122k.csv',
      'sea/weed-kelp-points-hydro-190k-1350k.csv',
      'sea/weed-kelp-polygons-hydro-122k-190k.csv',
      'sea/weed-kelp-polygons-hydro-14k-122k.csv',
      'sea/weed-kelp-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('weed'),
  });

  const H_distanceMarkers = await csvToGeoJson<Seamark['distance_mark']>({
    input: ['sea/distance-mark-points-hydro-14k-122k.csv'],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('distance_mark'),
  });

  const H_obstructions = await csvToGeoJson<Seamark['obstruction']>({
    input: [
      'sea/obstruction-points-hydro-115mil-and-smaller.csv',
      'sea/obstruction-points-hydro-122k-190k.csv',
      'sea/obstruction-points-hydro-1350k-11500k.csv',
      'sea/obstruction-points-hydro-14k-122k.csv',
      'sea/obstruction-points-hydro-190k-1350k.csv',
      'sea/obstruction-polygons-hydro-115mil-and-smaller.csv',
      'sea/obstruction-polygons-hydro-122k-190k.csv',
      'sea/obstruction-polygons-hydro-1350k-11500k.csv',
      'sea/obstruction-polygons-hydro-14k-122k.csv',
      'sea/obstruction-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    instructions: maritimeLinearInstructions,
    tagging: seamarkTagging('obstruction'),
  });

  const H_beaconCardinal = await csvToGeoJson<Seamark['beacon_cardinal']>({
    input: [
      'sea/beacon-cardinal-points-hydro-122k-190k.csv',
      'sea/beacon-cardinal-points-hydro-14k-122k.csv',
      'sea/beacon-cardinal-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('beacon_cardinal'),
  });

  const H_beaconIsolatedDanger = await csvToGeoJson<
    Seamark['beacon_isolated_danger']
  >({
    input: [
      'sea/beacon-isolated-danger-points-hydro-122k-190k.csv',
      'sea/beacon-isolated-danger-points-hydro-14k-122k.csv',
      'sea/beacon-isolated-danger-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('beacon_isolated_danger'),
  });

  const H_beaconLateral = await csvToGeoJson<Seamark['beacon_lateral']>({
    input: [
      'sea/beacon-lateral-points-hydro-122k-190k.csv',
      'sea/beacon-lateral-points-hydro-14k-122k.csv',
      'sea/beacon-lateral-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('beacon_lateral'),
  });

  const H_beaconSafeWater = await csvToGeoJson<Seamark['beacon_safe_water']>({
    input: [
      'sea/beacon-safe-water-points-hydro-122k-190k.csv',
      'sea/beacon-safe-water-points-hydro-14k-122k.csv',
      'sea/beacon-safe-water-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('beacon_safe_water'),
  });

  const H_beaconSpecialPurpose = await csvToGeoJson<
    Seamark['beacon_special_purpose']
  >({
    input: [
      'sea/beacon-special-purpose-general-points-hydro-115mil-and-small.csv',
      'sea/beacon-special-purpose-general-points-hydro-122k-190k.csv',
      'sea/beacon-special-purpose-general-points-hydro-1350k-11500k.csv',
      'sea/beacon-special-purpose-general-points-hydro-14k-122k.csv',
      'sea/beacon-special-purpose-general-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('beacon_special_purpose'),
  });

  const H_buoyCardinal = await csvToGeoJson<Seamark['buoy_cardinal']>({
    input: [
      'sea/buoy-cardinal-points-hydro-122k-190k.csv',
      'sea/buoy-cardinal-points-hydro-14k-122k.csv',
      'sea/buoy-cardinal-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('buoy_cardinal'),
  });

  const H_buoyIsolatedDanger = await csvToGeoJson<
    Seamark['buoy_isolated_danger']
  >({
    input: [
      'sea/buoy-isolated-danger-points-hydro-122k-190k.csv',
      'sea/buoy-isolated-danger-points-hydro-14k-122k.csv',
      'sea/buoy-isolated-danger-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('buoy_isolated_danger'),
  });

  const H_buoyLateral = await csvToGeoJson<Seamark['buoy_lateral']>({
    input: [
      'sea/buoy-lateral-points-hydro-122k-190k.csv',
      'sea/buoy-lateral-points-hydro-14k-122k.csv',
      'sea/buoy-lateral-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('buoy_lateral'),
  });

  const H_buoySafeWater = await csvToGeoJson<Seamark['buoy_safe_water']>({
    input: [
      'sea/buoy-safe-water-points-hydro-122k-190k.csv',
      'sea/buoy-safe-water-points-hydro-14k-122k.csv',
      'sea/buoy-safe-water-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('buoy_safe_water'),
  });

  const H_buoySpecialPurpose = await csvToGeoJson<
    Seamark['buoy_special_purpose']
  >({
    input: [
      'sea/buoy-special-purpose-general-points-hydro-115mil-and-smaller.csv',
      'sea/buoy-special-purpose-general-points-hydro-122k-190k.csv',
      'sea/buoy-special-purpose-general-points-hydro-1350k-11500k.csv',
      'sea/buoy-special-purpose-general-points-hydro-14k-122k.csv',
      'sea/buoy-special-purpose-general-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('buoy_special_purpose'),
  });

  const H_pilotBoarding = await csvToGeoJson<Seamark['pilot_boarding']>({
    input: [
      'sea/pilot-boarding-place-points-hydro-122k-190k.csv',
      'sea/pilot-boarding-place-points-hydro-14k-122k.csv',
      'sea/pilot-boarding-place-points-hydro-190k-1350k.csv',
      'sea/pilot-boarding-place-polygons-hydro-122k-190k.csv',
      'sea/pilot-boarding-place-polygons-hydro-14k-122k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('pilot_boarding'),
  });

  const H_radioCallInPoint = await csvToGeoJson<Seamark['calling-in_point']>({
    input: [
      'sea/radio-calling-in-point-points-hydro-122k-190k.csv',
      'sea/radio-calling-in-point-points-hydro-14k-122k.csv',
      'sea/radio-calling-in-point-points-hydro-190k-1350k.csv',
      'sea/radio-calling-in-point-polyline-hydro-122k-190k.csv',
      'sea/radio-calling-in-point-polyline-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('calling-in_point'),
  });

  const H_radioStation = await csvToGeoJson<Seamark['radio_station']>({
    input: [
      'sea/radio-station-points-hydro-115mil-and-smaller.csv',
      'sea/radio-station-points-hydro-122k-190k.csv',
      'sea/radio-station-points-hydro-1350k-11500k.csv',
      'sea/radio-station-points-hydro-14k-122k.csv',
      'sea/radio-station-points-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('radio_station'),
  });

  const H_restrictedArea = await csvToGeoJson<Seamark['restricted_area']>({
    input: [
      'sea/restricted-area-polygons-hydro-115mil-and-smaller.csv',
      'sea/restricted-area-polygons-hydro-122k-190k.csv',
      'sea/restricted-area-polygons-hydro-1350k-11500k.csv',
      'sea/restricted-area-polygons-hydro-14k-122k.csv',
      'sea/restricted-area-polygons-hydro-190k-1350k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    instructions: `${maritimeLinearInstructions}\n\nNote: This layer contains huge multipolygons,
      which need to be editted to use the coastline as outer ways`,
    complete: true,
    tagging: seamarkTagging('restricted_area'),
  });

  const H_wreck = await csvToGeoJson<Seamark['wreck']>({
    input: [
      'sea/wreck-points-hydro-122k-190k.csv',
      'sea/wreck-points-hydro-1350k-11500k.csv',
      'sea/wreck-points-hydro-14k-122k.csv',
      'sea/wreck-points-hydro-190k-1350k.csv',
      'sea/wreck-polygons-hydro-122k-190k.csv',
      'sea/wreck-polygons-hydro-14k-122k.csv',
    ],
    idField: 'fidn',
    sourceLayer: '',
    size: 'large',
    complete: true,
    tagging: seamarkTagging('wreck'),
  });

  //
  // misc
  //

  type TideStation = {
    id: string;
    /** the name */
    location: string;
    /** Reference tide gauge station for secondary tide gauge stations */
    ref_stn?: string;
    /** The reference benchmark to which the tide gauge has been levelled. */
    tg_bm?: string;
    /** The height difference from Chart Datum to the tide gauge reference benchmark */
    cd_to_bm?: string; // number
    mhws?: string; // number
    mhwn?: string; // number
    mlwn?: string; // number
    mlws?: string; // number
    msl?: string; // number
    hat?: string; // number
    lat?: string; // number
    data_start?: string;
    data_end?: string;
    /** Approximate length of data record in years. */
    data_len?: string; // number
    owner?: string;
    gauge_type?: string;
    /** Website from where tide predictions can be downloaded. */
    pred_link?: string;
    /** Website from where tide gauge data can be downloaded. */
    data_link?: string;
    /** International number of the tide gauge station. */
    int_number?: string;
  };
  const tideStations = await csvToGeoJson<TideStation>({
    input: 'tide-stations.csv',
    idField: 'id',
    sourceLayer: '52101',
    size: 'large',
    complete: true,
    tagging(data) {
      const isOld =
        data.data_end &&
        new Date(data.data_end.split('/').reverse().join('-')) < TODAY;
      if (isOld) return null; // no longer measuring, so don't map it

      return {
        'seamark:type': 'signal_station_warning',
        'seamark:signal_station_warning:category': 'tide_gauge',

        man_made: 'monitoring_station',
        'monitoring:tide_gauge': 'yes',
        source: 'LINZ',
        name: data.location,
        description: data.gauge_type, // barely used
        operator: data.owner,
        start_date: data.data_start?.split('/').reverse().join('-'),
        int_ref: data.int_number,
        'ref:linz:hydrographic_id': `tg${data.id}`,
        website:
          data.data_link || // prefer data_link, pred_link is a generic one
          data.pred_link ||
          'https://data.linz.govt.nz/layer/52101',
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
    'Z Quarries': quarries,
    'Z Racetracks': racetracks,
    'Z Rapids (line)': rapidLines,
    'Z Rapids (area)': rapidPolys,
    'Z Runways': runways,
    'Z Showgrounds': showgrounds,
    'Z Landslides': slipEdges,
    'Z Redoubts': redoubts,
    'Z Pinnacles': rockOutcrop,
    'Z Saddles': saddles,
    '❌ Tree Rows': shelterBelt,
    'Z Sinkholes': sinkholes,
    'Z Spillways': spillwayEdges,
    'Z Towers': towerPnts,
    'Z Siphons': {
      ...siphonPnts,
      features: [...siphonPolys.features, ...siphonPnts.features],
    },
    'ZZ Stations': stations,
    'Z Water Races': waterRace,

    // Geo Names
    'Z Named Bridges': namedBridges,
    'Z Named Cemetries': namedCemeteries,
    'Z Named Farms': namedFarms,
    'ZZ Homesteads': homesteads,
    'Z Huts': namedHuts,
    'Z Named Lights': namedLights,
    'Z Named Oil Wells': namedOilWell,
    'Z Named Wharfs': namedWharf,
    'Z Named Shipwrecks': namedShipwreck,
    'Z Named Pipelines': namedPipelines,
    'Z Named Parks': namedParks,
    'Z Pā or Marae': pāOrMarae,
    'Z Named Tunnels': namedTunnel,
    'Z Named Mines': namedMine,
    'Z Road Junctions': namedRoadRelatedFeature,
    'Z Named Campsites': namedCampSites,
    'Z Named Misc. Cultural Sites': namedMiscCulturalSite,

    // Hydrographic
    'Z Anchor Berths': H_anchorBerths,
    'Z Anchorages': H_anchorages,
    'Z Berths': H_berths,
    'Z Submarine Cables': H_submarineCables,
    'Z Daymarks': H_daymarks,
    'Z Dumping Ground': H_dumpingGrounds,
    'Z Fishing Facilities': H_fishingFacs,
    'Z Fog Signals': H_fogSignals,
    'Z Hulks': H_hulk,
    'Z Lights': H_lights,
    'Z Moorings': H_mooring,
    'Z Piles': H_piles,
    'Z Pontoons': H_pontoons,
    'Z Pylons': H_pylons,
    'Z Radar Stations': H_radarStations,
    'Z Radar Transponders': H_radarTransponder,
    'Z Rescue Stations': H_rescueStations,
    'Z Sand Waves': H_sandWaves,
    'Z Seaplane Runways': H_seaplaneRunways,
    'Z Springs': H_springs,
    'Z Topmarks': H_topmarks,
    'Z Sub-sea Rocks': H_subseaRocks,
    'Z Oil Rigs': H_oilRigs,
    'Z Pipelines': H_pipelines,
    'Z Recommended Maritime Tracks': H_recommendedTrack,
    'Z Maritime Navigation Lines': H_navigationLine,
    'Z Weeds': H_weeds,
    'Z Distance Markers': H_distanceMarkers,
    'Z Obstructions': H_obstructions,
    'Z Beacons - Cardinal': H_beaconCardinal,
    'Z Beacons - Isolated Danger': H_beaconIsolatedDanger,
    'Z Beacons - Lateral': H_beaconLateral,
    'Z Beacons - Safe Water': H_beaconSafeWater,
    'Z Maritime Markers': H_beaconSpecialPurpose,
    'Z Buoys - Cardinal': H_buoyCardinal,
    'Z Buoys - Isolated Danger': H_buoyIsolatedDanger,
    'Z Buoys - Lateral': H_buoyLateral,
    'Z Buoys - Safe Water': H_buoySafeWater,
    'Z Buoys - Special Purpose': H_buoySpecialPurpose,
    'Z Pilot Boarding Points': H_pilotBoarding,
    'Z Radio call-in Points': H_radioCallInPoint,
    'Z Radio Stations': H_radioStation,
    'Z Restricted maritime areas': H_restrictedArea,
    'Z Wrecks': H_wreck,

    'Z Tide Stations': tideStations,
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
