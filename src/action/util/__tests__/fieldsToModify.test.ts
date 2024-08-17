import { fieldsToModify } from '../fieldsToModify.js';

describe('fieldsToModify', () => {
  it.each`
    issues                                              | output
    ${['street|Right Street|Wrong Street']}             | ${{ 'addr:street': 'Right Street' }}
    ${['housenumber|12|12typo']}                        | ${{ 'addr:housenumber': '12' }}
    ${['water|1|0']}                                    | ${{ 'addr:type': 'water' }}
    ${['water|0|1']}                                    | ${{ 'addr:type': '🗑️' }}
    ${[]}                                               | ${{}}
    ${['suburb|addr:hamlet=my town|0']}                 | ${{ 'addr:hamlet': 'my town' }}
    ${['suburb|addr:hamlet=my town|addr:suburb=wrong']} | ${{ 'addr:hamlet': 'my town', 'addr:suburb': '🗑️' }}
    ${['suburb|addr:hamlet=my town|addr:hamlet=wrong']} | ${{ 'addr:hamlet': 'my town' }}
    ${['suburb|addr:suburb=city|addr:suburb=wrong']}    | ${{ 'addr:suburb': 'city' }}
    ${['suburb|addr:suburb=city|addr:hamlet=city']}     | ${{ 'addr:suburb': 'city', 'addr:hamlet': '🗑️' }}
    ${['suburb|addr:hamlet=rural|addr:suburb=rural']}   | ${{ 'addr:suburb': '🗑️', 'addr:hamlet': 'rural' }}
    ${['street|A Street|B Street', 'housenumber|1|2']}  | ${{ 'addr:housenumber': '1', 'addr:street': 'A Street' }}
  `('creates the correct out for $issues', ({ issues, output }) => {
    expect(fieldsToModify(issues)).toStrictEqual(output);
  });
});
