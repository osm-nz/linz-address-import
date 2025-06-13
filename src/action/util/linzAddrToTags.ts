import type { AddressId, LinzAddr, Tags } from '../../types.js';

export function linzAddrToTags(linzId: AddressId, addr: LinzAddr): Tags {
  return {
    'addr:housenumber': addr.housenumber,
    'alt_addr:housenumber': addr.housenumberAlt,
    'addr:street': addr.street,
    'addr:suburb': addr.suburb[0] === 'U' ? addr.suburb[1] : undefined,
    'addr:hamlet': addr.suburb[0] === 'R' ? addr.suburb[1] : undefined,
    'addr:city':
      addr.town && addr.town !== addr.suburb[1] ? addr.town : undefined,
    'addr:type': addr.water ? 'water' : undefined,
    'building:flats': addr.flatCount?.toString(),
    level: addr.level,
    'ref:linz:address_id': linzId,
    'linz:stack': addr.isManualStackRequest ? 'yes' : undefined,
  };
}

export function deleteAllAddressTags(): Tags {
  return {
    // delete all address-related tags
    'alt_addr:housenumber': '🗑️',
    'addr:housenumber': '🗑️',
    'addr:street': '🗑️',
    'addr:suburb': '🗑️',
    'addr:hamlet': '🗑️',
    'addr:city': '🗑️',
    'addr:country': '🗑️',
    'addr:postcode': '🗑️',
    'addr:type': '🗑️',
    'building:flats': '🗑️',
    // level is deliberately not included
    'linz:stack': '🗑️',
    'ref:linz:address_id': '🗑️',
    check_date: '🗑️',
  };
}
