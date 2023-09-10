import { getSector } from '../getSector';

describe('getSector', () => {
  it.each`
    lat           | lng           | small              | medium                  | large
    ${-47.025206} | ${167.915039} | ${'Sector I52'}    | ${'Stewart Island'}     | ${'Southland / Otago / Stewart Is'}
    ${-50.680797} | ${166.091308} | ${'Outer Islands'} | ${'Outer Islands'}      | ${'Outer Islands'}
    ${-44.00862}  | ${183.603515} | ${'Outer Islands'} | ${'Outer Islands'}      | ${'Outer Islands'}
    ${-43.548548} | ${171.518554} | ${'Sector W38'}    | ${'Selwyn/Ashburton'}   | ${'Canterbury / West Coast'}
    ${-41.590796} | ${172.617187} | ${'Sector AA30'}   | ${'Buller'}             | ${'Top of the South Island'}
    ${-41.095912} | ${175.319824} | ${'Sector LL28'}   | ${'Greater Wellington'} | ${'Greater Wellington'}
    ${-39.13006}  | ${177.099609} | ${'Sector SS21'}   | ${'Hawkes Bay North'}   | ${'Central NI'}
    ${-36.93233}  | ${174.902343} | ${'Sector KK12'}   | ${'Auckland South'}     | ${'Auckland'}
    ${-35.137879} | ${173.408203} | ${'Sector EE5'}    | ${'Far North'}          | ${'Northland'}
    ${-29.190532} | ${182.043457} | ${'Outer Islands'} | ${'Outer Islands'}      | ${'Outer Islands'}
    ${-18.531}    | ${-169.37}    | ${'Polynesia'}     | ${'Polynesia'}          | ${'Polynesia'}
    ${-40.807}    | ${-171.402}   | ${'Chatham Is.'}   | ${'Chatham Is.'}        | ${'Chatham Is.'}
    ${-77.8466}   | ${166.7489}   | ${'Sector UUU144'} | ${'Sector UUU144'}      | ${'Sector UUU144'}
  `('works for $lat,$lng ($small)', ({ lat, lng, small, medium, large }) => {
    expect(getSector({ lat, lng }, 'small')).toStrictEqual(small);
    expect(getSector({ lat, lng }, 'medium')).toStrictEqual(medium);
    expect(getSector({ lat, lng }, 'large')).toStrictEqual(large);
  });
});
