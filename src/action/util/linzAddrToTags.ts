import { LinzAddr, Tags } from '../../types';

export function linzAddrToTags(linzId: string, addr: LinzAddr): Tags {
  return {
    'addr:housenumber': addr.housenumber,
    'addr:street': addr.street,
    'addr:suburb': addr.suburb[0] === 'U' ? addr.suburb[1] : undefined,
    'addr:hamlet': addr.suburb[0] === 'R' ? addr.suburb[1] : undefined,
    'addr:type': addr.water ? 'water' : undefined,
    'building:flats': addr.flatCount?.toString(),
    'ref:linz:address_id': linzId,
  };
}

export function deleteAllAddressTags(): Tags {
  return {
    // delete all address-related tags
    'addr:housenumber': '🗑️',
    'addr:street': '🗑️',
    'addr:suburb': '🗑️',
    'addr:hamlet': '🗑️',
    'addr:type': '🗑️',
    'building:flats': '🗑️',
    'ref:linz:address_id': '🗑️',
    check_date: '🗑️',
  };
}
