import { Issue } from '../../types';

export function fieldsToModify(issues: Issue[]): Record<string, string> {
  const ac: Record<string, string> = {};
  for (const i of issues) {
    const [field, linzValue, osmValue] = i.split('|');
    switch (field) {
      case 'housenumber':
        ac.addr_housenumber = linzValue;
        break;
      case 'street':
        ac.addr_street = linzValue;
        break;
      case 'suburb': {
        const [k, v] = linzValue.split('=');
        ac[k] = v;
        break;
      }
      case 'water': {
        if (linzValue === '0' && osmValue === '1') {
          ac.addr_type = '🗑️'; // delete the tag
        } else {
          // this implies linzValue == 1 && osmValue == 0
          ac.addr_type = 'water';
        }
        break;
      }
      default:
        throw new Error('Unexpected field type');
    }
  }
  return ac;
}
