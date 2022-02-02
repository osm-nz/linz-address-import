import {
  OsmChange,
  OsmFeature,
  OsmNode,
  OsmRelation,
  OsmWay,
  createOsmChangeXml,
} from 'osm-api';
import { MAP } from '../util';
import {
  GeoJson,
  GeoJsonPoint,
  GeoJsonLine,
  GeoJsonMultiPolygon,
} from '../../types';
import { amendOsmChangeFeature } from './amendOsmChangeFeature';

type Tags = Record<string, string | undefined>;

/** when you access `ID.node` etc., it will always give you a new ID */
class IDManager {
  #count = { node: 0, way: 0, relation: 0 };

  get node() {
    this.#count.node -= 1;
    return this.#count.node;
  }

  get way() {
    this.#count.way -= 1;
    return this.#count.way;
  }

  get relation() {
    this.#count.relation -= 1;
    return this.#count.relation;
  }

  get changesetSize() {
    return -this.#count.node + -this.#count.way + -this.#count.relation;
  }
}

function handleNode(
  ID: IDManager,
  geometry: GeoJsonPoint,
  tags: Tags,
): OsmFeature[] {
  const [lon, lat] = geometry.coordinates;
  const node = { type: 'node', id: ID.node, lat, lon, tags } as OsmNode;

  return [node];
}

function handleWay(
  ID: IDManager,
  geometry: GeoJsonLine,
  tags: Tags,
): OsmFeature[] {
  const nodes: OsmNode[] = [];
  for (const [lon, lat] of geometry.coordinates) {
    const node = { type: 'node', id: ID.node, lat, lon } as OsmNode;
    nodes.push(node);
  }

  const way = {
    type: 'way',
    id: ID.way,
    tags,
    nodes: nodes.map((n) => n.id),
  } as OsmWay;

  return [...nodes, way];
}

function handleMultiPolygon(
  ID: IDManager,
  geometry: GeoJsonMultiPolygon,
  tags: Tags,
): OsmFeature[] {
  const nodes: OsmNode[] = [];
  const ways: OsmWay[] = [];
  const members: OsmRelation['members'] = [];

  for (const group of geometry.coordinates) {
    for (let i = 0; i < group.length; i += 1) {
      const shape = group[i];
      const theseNodes: OsmNode[] = [];

      for (const [lon, lat] of shape) {
        const node = { type: 'node', id: ID.node, lat, lon } as OsmNode;
        theseNodes.push(node);
      }

      const way = {
        type: 'way',
        id: ID.way,
        nodes: theseNodes.map((n) => n.id),
      } as OsmWay;
      ways.push(way);
      members.push({
        type: 'way',
        ref: way.id,
        role: i === 0 ? 'outer' : 'inner',
      });
    }
  }

  const relation = {
    type: 'relation',
    id: ID.relation,
    tags,
    members,
  } as OsmRelation;

  return [...nodes, ...ways, relation];
}

export function geoJsonToOSMChange(
  geoJson: GeoJson,
  fileName: string,
  count: string,
): { osmChange: string; tooBig: boolean } {
  const ID = new IDManager();

  const osmChange: OsmChange = { create: [], modify: [], delete: [] };

  for (const feature of geoJson.features) {
    if (feature.id.startsWith('SPECIAL_EDIT_')) {
      // you can edit nodes, ways, and relations
      const { __osmId, ...tags } = feature.properties;
      const id = +__osmId!.slice(1);
      const type = MAP[__osmId![0] as 'n' | 'w' | 'r'];

      const editedOsmFeat = amendOsmChangeFeature(type, id, tags);

      osmChange.modify.push(editedOsmFeat);
    } else if (feature.id.startsWith('SPECIAL_DELETE_')) {
      // you can only delete nodes
      const [lon, lat] = (feature.geometry as GeoJsonPoint).coordinates;
      const { __osmId, ...tags } = feature.properties;
      const node = {
        type: 'node',
        lat,
        lon,
        id: +__osmId!.slice(1),
        tags,
      } as OsmNode;
      osmChange.delete.push(node);
    } else if (feature.id.startsWith('SPECIAL_MOVE_')) {
      // you can only move nodes
      const [lon, lat] = (feature.geometry as GeoJsonLine).coordinates[1];
      const { __osmId, ...tags } = feature.properties;
      const node = {
        type: 'node',
        lat,
        lon,
        id: +__osmId!.slice(1),
        tags,
      } as OsmNode;
      osmChange.modify.push(node);
    } else {
      // create
      switch (feature.geometry.type) {
        case 'Point': {
          osmChange.create.push(
            ...handleNode(ID, feature.geometry, feature.properties),
          );
          break;
        }

        case 'LineString': {
          // way
          osmChange.create.push(
            ...handleWay(ID, feature.geometry, feature.properties),
          );
          break;
        }

        case 'Polygon': {
          if (feature.geometry.coordinates.length === 1) {
            // area
            // to simplify the code, we can treat a geojson polygon with only one outer ring as a (closed)-way
            const geom: GeoJsonLine = {
              type: 'LineString',
              coordinates: feature.geometry.coordinates[0],
            };
            osmChange.create.push(...handleWay(ID, geom, feature.properties));
          } else {
            // multipolygon
            // a geojson polygon with only multiple outer rings is just a simple geojson multipolygon
            const geom: GeoJsonMultiPolygon = {
              type: 'MultiPolygon',
              coordinates: [feature.geometry.coordinates],
            };
            osmChange.create.push(
              ...handleMultiPolygon(ID, geom, feature.properties),
            );
          }
          break;
        }

        case 'MultiPolygon': {
          osmChange.create.push(
            ...handleMultiPolygon(ID, feature.geometry, feature.properties),
          );
          break;
        }

        // will never happen
        default:
          throw new Error(
            // @ts-expect-error ts knows this can never happen
            `Invalid geojson type in ${fileName}: ${feature.geometry.type}`,
          );
      }
    }
  }

  const tooBig = ID.changesetSize >= 10_000;

  // this would brek the snapshot tests
  const date =
    process.env.NODE_ENV === 'test'
      ? 'DATE_GOES_HERE'
      : new Date().toISOString();

  const xml = createOsmChangeXml(0, osmChange, {
    $generator: 'LINZ Data Import',
    $LINZ_title: fileName,
    $LINZ_count: count,
    $LINZ_generated_on: date,
  });
  return { osmChange: xml, tooBig };
}
