import type { Tags } from 'osm-api';
import type { AddressId, LinzAddr } from '../../types.js';

export function linzAddrToTags(linzId: AddressId, addr: LinzAddr): Tags {
  const tags: Record<string, string | undefined> = {
    'addr:housenumber': addr.housenumber,
    'alt_addr:housenumber': addr.housenumberAlt,
    'addr:street': addr.street,
    'addr:suburb': addr.suburb,
    // we don't add `addr:city`
    'addr:type': addr.water ? 'water' : undefined,
    'building:flats': addr.flatCount?.toString(),
    'ref:linz:address_id': linzId,
    'linz:stack': addr.isManualStackRequest ? 'yes' : undefined,
  };
  for (const k in tags) if (!tags[k]) delete tags[k];
  return <Tags>tags;
}

export function deleteAllAddressTags(): Tags {
  return {
    // delete all address-related tags
    'alt_addr:housenumber': '🗑️',
    'alt_addr:street': '🗑️',
    'addr2:housenumber': '🗑️',
    'addr2:street': '🗑️',
    'addr3:housenumber': '🗑️',
    'addr3:street': '🗑️',
    'addr4:housenumber': '🗑️',
    'addr4:street': '🗑️',
    'addr:housenumber': '🗑️',
    'addr:street': '🗑️',
    'addr:suburb': '🗑️',
    'addr:hamlet': '🗑️',
    'addr:city': '🗑️',
    'addr:country': '🗑️',
    'addr:postcode': '🗑️',
    'addr:type': '🗑️',
    'building:flats': '🗑️',
    'linz:stack': '🗑️',
    'ref:linz:address_id': '🗑️',
    check_date: '🗑️',
  };
}
