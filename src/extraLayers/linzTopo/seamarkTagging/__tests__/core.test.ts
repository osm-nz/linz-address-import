import { seamarkTagging } from '../core';

describe('MapCat', () => {
  it('maps seamark properties', () => {
    const full = seamarkTagging('platform')(
      {
        fidn: '00000123',
        nobjnm: 'Öl Rig II',
        objnam: 'Oil Rig II',
        inform: 'ew',
        datsta: '2001',
        sordat: '20021225',
        sorind: 'NZ,NZ,graph,Chart NZ4315',
        prodct: 'Liquified petroleum gas (LPG)',
        catofp: '8',
        verlen: '12',
      },
      '',
      'Approaches to Port Taranaki',
    );
    const undefinedStripped = JSON.parse(JSON.stringify(full));
    expect(undefinedStripped).toStrictEqual({
      man_made: 'floating_storage',
      name: 'Öl Rig II',
      description: 'ew',
      height: '12',
      'ref:linz:hydrographic_id': '123',
      source: 'LINZ;Approaches to Port Taranaki Chart;Chart NZ4315',
      'source:date': '2002-12-25',
      start_date: '2001',

      'seamark:type': 'platform',

      'seamark:platform:height': '12',
      'seamark:platform:category': 'fpso',
      'seamark:platform:product': 'lpg',
    });
  });
});
