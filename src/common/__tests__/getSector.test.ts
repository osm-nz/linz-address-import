import { getSector } from '../getSector';

describe('getSector', () => {
  it.each`
    lat           | lng           | small              | medium                  | large
    ${-47.025206} | ${167.915039} | ${'Sector D23'}    | ${'Stewart Island'}     | ${'Southland / Otago / Stewart Is'}
    ${-50.680797} | ${166.091308} | ${'Outer Islands'} | ${'Outer Islands'}      | ${'Outer Islands'}
    ${-44.00862}  | ${183.603515} | ${'Outer Islands'} | ${'Outer Islands'}      | ${'Outer Islands'}
    ${-43.548548} | ${171.518554} | ${'Sector K17'}    | ${'Timaru'}             | ${'Canterbury / West Coast'}
    ${-41.590796} | ${172.617187} | ${'Sector M13'}    | ${'Buller/Hurunui'}     | ${'Top of the South Island'}
    ${-41.095912} | ${175.319824} | ${'Sector Q12'}    | ${'Greater Wellington'} | ${'Greater Wellington'}
    ${-39.13006}  | ${177.099609} | ${'Sector T9'}     | ${'Hawkes Bay'}         | ${'Central NI'}
    ${-36.93233}  | ${174.902343} | ${'Sector Q5'}     | ${'Auckland South'}     | ${'Auckland'}
    ${-35.137879} | ${173.408203} | ${'Sector N2'}     | ${'Far North'}          | ${'Northland'}
    ${-29.190532} | ${182.043457} | ${'Outer Islands'} | ${'Outer Islands'}      | ${'Outer Islands'}
    ${-18.531}    | ${-169.37}    | ${'Polynesia'}     | ${'Polynesia'}          | ${'Polynesia'}
    ${-77.8466}   | ${166.7489}   | ${'01'}            | ${'01'}                 | ${'01' /* antarctic is chunked by index */}
  `('works for $lat,$lng ($small)', ({ lat, lng, small, medium, large }) => {
    expect(getSector({ lat, lng }, 'small', 0)).toStrictEqual(small);
    expect(getSector({ lat, lng }, 'medium', 0)).toStrictEqual(medium);
    expect(getSector({ lat, lng }, 'large', 0)).toStrictEqual(large);
  });
});
