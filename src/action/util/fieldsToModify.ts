import type { Issue, IssueType, Tags } from '../../types.js';

export function fieldsToModify(issues: Issue[], linzId: string): Tags {
  const ac: Record<string, string> = {};
  for (const issue of issues) {
    const [field, linzValue, osmValue] = issue.split('|') as [
      IssueType,
      string,
      string,
    ];
    switch (field) {
      case 'housenumber': {
        ac['addr:housenumber'] = linzValue;
        break;
      }

      case 'housenumberAlt': {
        ac['alt_addr:housenumber'] = linzValue;
        break;
      }

      case 'street': {
        ac['addr:street'] = linzValue;
        break;
      }

      case 'suburb': {
        const [k, v] = linzValue.split('=') as [
          'addr:hamlet' | 'addr:suburb',
          string,
        ];
        const [oldK] = osmValue.split('=') as [
          'addr:hamlet' | 'addr:suburb' | '0',
          string,
        ];
        if (k !== oldK && oldK !== '0') {
          // hamlet changed to suburb or vica-versa
          ac[oldK] = '🗑️'; // delete the tag
        }
        ac[k] = v;
        break;
      }

      case 'town': {
        ac['addr:city'] = linzValue;
        break;
      }

      case 'water': {
        // eslint-disable-next-line unicorn/prefer-ternary -- more readable like this
        if (linzValue === '0' && osmValue === '1') {
          ac['addr:type'] = '🗑️'; // delete the tag
        } else {
          // this implies linzValue == 1 && osmValue == 0
          ac['addr:type'] = 'water';
        }
        break;
      }

      case 'flatCount': {
        // eslint-disable-next-line unicorn/prefer-ternary -- more readable like this
        if (linzValue === '0' && osmValue !== '0') {
          ac['building:flats'] = '🗑️'; // delete the tag
        } else {
          // this implies linzValue != 0 && linzValue != osmValue
          ac['building:flats'] = linzValue;
        }
        break;
      }

      case 'level': {
        ac.level = linzValue;
        break;
      }

      case 'altRef': {
        // remove any altRefs from the ref tag
        ac['ref:linz:address_id'] = linzId;
        break;
      }

      default: {
        const exhaustiveCheck: never = field; // if TS errors here, a case statement is missing

        throw new Error(`Unexpected field type: ${exhaustiveCheck}`);
      }
    }
  }
  return ac;
}
