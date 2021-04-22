import { getSector } from '../getSector';

describe('getSector', () => {
  it.each`
    lat           | lng           | sector
    ${-47.025206} | ${167.915039} | ${'Southland / Otago / Stewart Is'}
    ${-50.680797} | ${166.091308} | ${'Outer Islands'}
    ${-44.00862}  | ${183.603515} | ${'Outer Islands'}
    ${-43.548548} | ${171.518554} | ${'Canterbury / West Coast'}
    ${-41.590796} | ${172.617187} | ${'Top of the South Island'}
    ${-41.095912} | ${175.319824} | ${'Lower NI'}
    ${-39.13006}  | ${177.099609} | ${'Central NI'}
    ${-36.93233}  | ${174.902343} | ${'Auckland'}
    ${-35.137879} | ${173.408203} | ${'Northland'}
    ${-29.190532} | ${182.043457} | ${'Outer Islands'}
    ${-77.8466}   | ${166.7489}   | ${'Antarctic'}
  `('works for $lat,$lng ($sector)', ({ lat, lng, sector }) => {
    expect(getSector({ lat, lng })).toStrictEqual(sector);
  });
});
