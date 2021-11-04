import { cleanSequence } from '..';
import { cleanDate, cleanSource } from '../helpers';

describe('cleanDate', () => {
  it('correct converts the date format', () => {
    expect(cleanDate('12345678')).toBe('1234-56-78');
    expect(cleanDate('123456')).toBe('1234-56');
    expect(cleanDate('1234')).toBe('1234');
    expect(cleanDate(undefined)).toBeUndefined();
  });
});

describe('cleanSource', () => {
  it('correct converts the source tag', () => {
    expect(cleanSource('NZ,NZ,NZ,Abc', undefined)).toBe('LINZ;Abc');
    expect(cleanSource('graph,NZ,Chart123', undefined)).toBe('LINZ;Chart123');
    expect(cleanSource(undefined, undefined)).toBe('LINZ');

    expect(cleanSource('graph,,', undefined)).toBe('LINZ');

    expect(cleanSource('reprt,HITS 14600/295', 'Auckland Harbour East')).toBe(
      'LINZ;Auckland Harbour East Chart;HITS 14600/295',
    );
    expect(cleanSource(undefined, 'Mainland - Auckland Harbour West')).toBe(
      'LINZ;Auckland Harbour West Chart',
    );

    expect(cleanSource(undefined, 'Ross Sea - West')).toBe(
      'LINZ;Ross Sea (West) Chart',
    );
    expect(cleanSource(undefined, 'Ross Sea - Westt')).toBe('LINZ;Westt Chart');
  });
});

describe('cleanSequence', () => {
  it.each`
    input                       | output
    ${'01.0+(09.0)+001.0+02.0'} | ${'1+(9)+1+2'}
    ${'00001.0+(9.0)+2.1'}      | ${'1+(9)+2.1'}
    ${'00.5+(03.5)'}            | ${'0.5+(3.5)'}
  `('cleans sequence strings ($input)', ({ input, output }) => {
    expect(cleanSequence(input)).toBe(output);
  });
});
