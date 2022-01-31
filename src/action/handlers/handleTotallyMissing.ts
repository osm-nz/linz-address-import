/* eslint-disable no-param-reassign */
import {
  GeoJsonFeature,
  HandlerReturn,
  LinzAddr,
  OsmId,
  Status,
  StatusReport,
} from '../../types';

type BySuburb = {
  [suburb: string]: [
    linzId: string,
    data: LinzAddr & {
      osmId?: OsmId;
    },
  ][];
};

export async function handleTotallyMissing(
  arr: StatusReport[Status.TOTALLY_MISSING],
  needsDeleteArr: StatusReport[Status.NEEDS_DELETE],
): Promise<HandlerReturn> {
  const tmp = arr.reduce((ac, [, data]) => {
    const suburb = data.suburb[1];
    if (!ac[suburb]) {
      ac[suburb] = [data.town];
    } else if (!ac[suburb].includes(data.town)) {
      ac[suburb].push(data.town);
    }
    return ac;
  }, {} as Record<string, string[]>);
  const duplicates = Object.keys(tmp).filter((k) => tmp[k].length > 1);

  const bySuburb = arr.reduce<BySuburb>((ac, [linzId, data]) => {
    const suburb = data.suburb[1];
    const key = duplicates.includes(suburb)
      ? `${suburb} (${data.town || 'Rural'})`
      : suburb;

    ac[key] ||= [];
    ac[key].push([linzId, data]);
    return ac;
  }, {});

  for (const [linzId, [suburb, osmAddr]] of needsDeleteArr) {
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
          geometry: {
            type: 'Point',
            coordinates: [addr.lng, addr.lat],
          },
          properties: {
            __action: addr.osmId && 'delete',

            'addr:housenumber': addr.housenumber,
            'addr:street': addr.street,
            'addr:suburb': addr.suburb[0] === 'U' ? addr.suburb[1] : undefined,
            'addr:hamlet': addr.suburb[0] === 'R' ? addr.suburb[1] : undefined,
            'addr:type': addr.water ? 'water' : undefined,
            'building:flats': addr.flatCount?.toString(),
            'ref:linz:address_id': linzId,
          },
        };
      },
    );

    index[`Address Update - ${suburb}`] = features;
  }

  return index;
}
/* eslint-enable no-param-reassign */
