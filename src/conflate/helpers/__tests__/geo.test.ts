import { distanceBetween } from '../geo';

describe('distanceBetween', () => {
  it.each`
    node1                       | node2                       | metres
    ${[-36.852913, 174.762504]} | ${[-36.851949, 174.763633]} | ${146.905257}
    ${[-36.918297, 174.812448]} | ${[-36.85213, 174.761666]}  | ${8633.0876769}
    ${[-36.85213, 174.761666]}  | ${[-36.85213, 174.761666]}  | ${0}
  `(
    'correctly calculates the distance between nodes $#',
    ({ node1, node2, metres }) => {
      expect(
        distanceBetween(node1[0], node1[1], node2[0], node2[1]),
      ).toBeCloseTo(metres);
    },
  );
});
