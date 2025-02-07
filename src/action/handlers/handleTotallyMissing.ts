import type {
  GeoJsonFeature,
  HandlerReturn,
  LinzAddr,
  OsmId,
  Status,
  StatusReport,
} from '../../types.js';
import { LAYER_PREFIX, createSquare, linzAddrToTags } from '../util/index.js';

type BySuburb = {
  [suburb: string]: [
    linzId: string,
    data: LinzAddr & {
      osmId?: OsmId;
    },
  ][];
};

export async function handleTotallyMissing(
  array: StatusReport[Status.TOTALLY_MISSING],
  needsDeleteArray: StatusReport[Status.NEEDS_DELETE],
): Promise<HandlerReturn> {
  const temp = array.reduce(
    (ac, [, data]) => {
      const suburb = data.suburb[1];
      if (!ac[suburb]) {
        ac[suburb] = [data.town];
      } else if (!ac[suburb].includes(data.town)) {
        ac[suburb].push(data.town);
      }
      return ac;
    },
    {} as Record<string, string[]>,
  );
  const duplicates = new Set(
    Object.keys(temp).filter((k) => temp[k].length > 1),
  );

  const bySuburb = array.reduce<BySuburb>((ac, [linzId, data]) => {
    const suburb = data.suburb[1];
    const key = duplicates.has(suburb)
      ? `${suburb} (${data.town || 'Rural'})`
      : suburb;

    ac[key] ||= [];
    ac[key].push([linzId, data]);
    return ac;
  }, {});

  for (const [linzId, [suburb, osmAddr]] of needsDeleteArray) {
    // ideally we would deduce which town this deletion belongs to,
    // but there is no trivial way of doing that, so we create a third suburb (Deletions)
    const key = suburb;

    bySuburb[key] ||= [];

    // because we are deleting the node, if the data is incorrect in osm we don't care so
    // use the OSM data. We identify it as a node to delete if it has the osmId `prop`.
    const fakeLinzAddr = Object.assign(osmAddr, { town: '' }) as LinzAddr;
    fakeLinzAddr.suburb ||= ['' as 'U', suburb]; // sneaky

    bySuburb[key].push([linzId, fakeLinzAddr]);
  }

  const index: HandlerReturn = {};

  for (const suburb in bySuburb) {
    const features: GeoJsonFeature[] = bySuburb[suburb].map(
      ([linzId, addr]) => {
        return {
          type: 'Feature',
          // for deletes, the osmId will exist. For creates, the ID is irrelevant, so it's the linzId
          id: addr.osmId || linzId,
          geometry: addr.osmId
            ? { type: 'Polygon', coordinates: createSquare(addr) }
            : { type: 'Point', coordinates: [addr.lng, addr.lat] },
          properties: {
            __action: addr.osmId && 'delete',
            ...linzAddrToTags(linzId, addr),
          },
        };
      },
    );

    index[LAYER_PREFIX + suburb] = features;
  }

  return index;
}
