import { getSector } from '../getSector.js';

describe(getSector, () => {
  it.each`
    lat           | lng           | result
    ${-47.025206} | ${167.915039} | ${'83daaa'}
    ${-50.680797} | ${166.091308} | ${'83da18'}
  `('works for $lat,$lng ($small)', ({ lat, lng, result }) => {
    expect(getSector({ lat, lng })).toStrictEqual(result);
  });
});
