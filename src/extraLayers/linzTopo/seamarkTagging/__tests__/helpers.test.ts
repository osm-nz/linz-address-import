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
    expect(cleanSource('NZ,NZ,NZ,Abc')).toBe('LINZ;Abc');
    expect(cleanSource('graph,NZ,Chart123')).toBe('LINZ;Chart123');
    expect(cleanSource(undefined)).toBe('LINZ');
  });
});
