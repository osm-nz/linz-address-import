import { fieldsToModify } from '../fieldsToModify.js';

describe('fieldsToModify', () => {
  it.each`
    issues                                              | output
    ${['street|Right Street|Wrong Street']}             | ${{ 'addr:street': 'Right Street' }}
    ${['housenumber|12|12typo']}                        | ${{ 'addr:housenumber': '12' }}
    ${['water|1|0']}                                    | ${{ 'addr:type': 'water' }}
    ${['water|0|1']}                                    | ${{ 'addr:type': '🗑️' }}
    ${[]}                                               | ${{}}
    ${['suburb|my town|                             ']} | ${{ 'addr:suburb': 'my town' }}
    ${['doubleSuburb||']}                               | ${{ 'addr:hamlet': '🗑️' }}
    ${['street|A Street|B Street', 'housenumber|1|2']}  | ${{ 'addr:housenumber': '1', 'addr:street': 'A Street' }}
  `('creates the correct out for $issues', ({ issues, output }) => {
    expect(fieldsToModify(issues)).toStrictEqual(output);
  });
});
