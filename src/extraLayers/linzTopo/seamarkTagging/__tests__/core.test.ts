import { seamarkTagging } from '../core';

describe('MapCat', () => {
  it('maps seamark properties', () => {
    const tags = seamarkTagging('platform')(
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
      'Point',
    );
    expect(tags).toStrictEqual({
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

  it('works for lights', () => {
    // there's a lot of transformations for lights
    const tags = seamarkTagging('light')(
      {
        fidn: '00000123',
        sectr1: '350.600000000000023',
        sectr2: '6.600000000000000',
        litchr: 'long-flash alternating',
        colour: '9',
        siggrp: '(1)',
        verlen: '38',
        sigper: '10',
        valnmr: '9.000000000000000',
        sigseq: '01.0+(09.0)',
        litvis: '3',
      },
      '',
      'Approaches to Waitangi',
      'Point',
    );
    expect(tags).toStrictEqual({
      height: '38',
      'ref:linz:hydrographic_id': '123',
      'seamark:light:character': 'Al.LFl',
      'seamark:light:colour': 'amber',
      'seamark:light:group': '1',
      'seamark:light:height': '38',
      'seamark:light:period': '10',
      'seamark:light:range': '9',
      'seamark:light:sector_end': '6.6',
      'seamark:light:sector_start': '350.6',
      'seamark:light:sequence': '1+(9)',
      'seamark:light:visibility': 'faint',
      'seamark:type': 'light_minor',
      source: 'LINZ;Approaches to Waitangi Chart',
    });
  });
});
