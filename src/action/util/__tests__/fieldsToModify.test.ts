import { fieldsToModify } from '../fieldsToModify';

describe('fieldsToModify', () => {
  it.each`
    issues                                              | output
    ${['street|Right Street|Wrong Street']}             | ${{ addr_street: 'Right Street' }}
    ${['housenumber|12|12typo']}                        | ${{ addr_housenumber: '12' }}
    ${['water|1|0']}                                    | ${{ addr_type: 'water' }}
    ${['water|0|1']}                                    | ${{ addr_type: '🗑️' }}
    ${[]}                                               | ${{}}
    ${['suburb|addr_hamlet=my town|0']}                 | ${{ addr_hamlet: 'my town' }}
    ${['suburb|addr_hamlet=my town|addr_suburb=wrong']} | ${{ addr_hamlet: 'my town' }}
    ${['suburb|addr_hamlet=my town|addr_hamlet=wrong']} | ${{ addr_hamlet: 'my town' }}
    ${['suburb|addr_suburb=city|addr_suburb=wrong']}    | ${{ addr_suburb: 'city' }}
    ${['suburb|addr_suburb=city|addr_hamlet=city']}     | ${{ addr_suburb: 'city' }}
    ${['street|A Street|B Street', 'housenumber|1|2']}  | ${{ addr_housenumber: '1', addr_street: 'A Street' }}
  `('creates the correct out for $issues', ({ issues, output }) => {
    expect(fieldsToModify(issues)).toStrictEqual(output);
  });
});
