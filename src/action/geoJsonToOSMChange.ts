import {
  GeoJson,
  GeoJsonPoint,
  GeoJsonLine,
  GeoJsonMultiPolygon,
} from '../types';

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

const tagsToXml = (tags: Tags) =>
  Object.entries(tags)
    .filter(([k, v]) => k && v)
    .map(([k, v]) => `<tag k="${k}" v="${v}" />`)
    .join('\n      ');

function handleNode(ID: IDManager, geometry: GeoJsonPoint, tags: Tags) {
  const [lng, lat] = geometry.coordinates;
  return `
    <node id="${ID.node}" lon="${lng}" lat="${lat}" version="0">
      ${tagsToXml(tags)}
    </node>`;
}

function handleWay(ID: IDManager, geometry: GeoJsonLine, tags: Tags) {
  let str = '';
  const nodes = [];
  for (const [lng, lat] of geometry.coordinates) {
    const id = ID.node;
    nodes.push(id);
    str += `<node id="${id}" lon="${lng}" lat="${lat}" version="0" />\n    `;
  }

  str += `
    <way id="${ID.way}" version="0">
      ${nodes.map((id) => `<nd ref="${id}" />`).join('\n      ')}
      ${tagsToXml(tags)}
    </way>
  `;

  return str;
}

function handleMultiPolygon(
  ID: IDManager,
  geometry: GeoJsonMultiPolygon,
  tags: Tags,
) {
  let str = '';
  const ways: { wayId: number; role: string }[] = [];
  for (const group of geometry.coordinates) {
    for (let i = 0; i < group.length; i += 1) {
      const shape = group[i];
      const nodes = [];
      for (const [lng, lat] of shape) {
        const nodeId = ID.node;
        nodes.push(nodeId);
        str += `<node id="${nodeId}" lon="${lng}" lat="${lat}" version="0" />\n    `;
      }
      const wayId = ID.way;
      ways.push({ wayId, role: i === 0 ? 'outer' : 'inner' });
      str += `
        <way id="${wayId}" version="0">
          ${nodes.map((id) => `<nd ref="${id}" />`).join('\n    ')}
        </way>
      `;
    }
  }
  str += `
    <relation id="${ID.relation}" version="0">
      ${ways
        .map((w) => `<member type="way" role="${w.role}" ref="${w.wayId}"/>`)
        .join('\n     ')}
      ${tagsToXml(tags)}
    </relation>
  `;
  return str;
}

export function geoJsonToOSMChange(
  geoJson: GeoJson,
  fileName: string,
  count: string,
): { osmChange: string; tooBig: boolean } {
  const ID = new IDManager();

  let out = '';
  for (const feature of geoJson.features) {
    switch (feature.geometry.type) {
      case 'Point': {
        out += handleNode(ID, feature.geometry, feature.properties);
        break;
      }

      case 'LineString': {
        // way
        out += handleWay(ID, feature.geometry, feature.properties);
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
          out += handleWay(ID, geom, feature.properties);
        } else {
          // multipolygon
          // a geojson polygon with only multiple outer rings is just a simple geojson multipolygon
          const geom: GeoJsonMultiPolygon = {
            type: 'MultiPolygon',
            coordinates: [feature.geometry.coordinates],
          };
          out += handleMultiPolygon(ID, geom, feature.properties);
        }
        break;
      }

      case 'MultiPolygon': {
        out += handleMultiPolygon(ID, feature.geometry, feature.properties);
        break;
      }

      // will never happen
      default:
        throw new Error('Invalid geojson type');
    }
  }

  const tooBig = ID.changesetSize >= 10_000;

  // this would brek the snapshot tests
  const date =
    process.env.NODE_ENV === 'test'
      ? 'DATE_GOES_HERE'
      : new Date().toISOString();

  const osmChange = `
<osmChange version="0.6" generator="LINZ Data Import" LINZ_title="${fileName}" LINZ_count="${count}" LINZ_generated_on="${date}">
  <create>
    ${out}
  </create>
  <modify />
  <delete if-unused="true" />
</osmChange>`;
  return { osmChange, tooBig };
}
