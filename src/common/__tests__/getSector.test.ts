import { getSector } from '../getSector';

describe('getSector', () => {
  it.each`
    lat           | lng           | sector
    ${-47.025206} | ${167.915039} | ${'Stewart Island'}
    ${-50.680797} | ${166.091308} | ${'Outer Islands'}
    ${-44.00862}  | ${183.603515} | ${'Outer Islands'}
    ${-43.548548} | ${171.518554} | ${'Timaru'}
    ${-41.590796} | ${172.617187} | ${'Buller/Hurunui'}
    ${-41.095912} | ${175.319824} | ${'Greater Wellington'}
    ${-39.13006}  | ${177.099609} | ${'Hawkes Bay'}
    ${-36.93233}  | ${174.902343} | ${'Auckland South'}
    ${-35.137879} | ${173.408203} | ${'Far North'}
    ${-29.190532} | ${182.043457} | ${'Outer Islands'}
    ${-77.8466}   | ${166.7489}   | ${'Antarctic'}
  `('works for $lat,$lng ($sector)', ({ lat, lng, sector }) => {
    expect(getSector({ lat, lng })).toStrictEqual(sector);
  });
});
