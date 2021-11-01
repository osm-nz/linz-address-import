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

    expect(cleanSource('reprt,HITS 14600/295', 'Auckland Harbour East')).toBe(
      'LINZ;Auckland Harbour East Chart;HITS 14600/295',
    );
    expect(cleanSource(undefined, 'Auckland Harbour West')).toBe(
      'LINZ;Auckland Harbour West Chart',
    );
  });
});
