//
// modified from npm.im/simplify-js
// example: https://github.com/osm-nz/linz-address-import/blob/main/src/extraLayers/linzTopo/geoOperations/__tests__/simplify.geo.json
//

type Coord = [x: number, y: number];

// to suit your point format, run search/replace for '.x' and '.y';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)

// square distance between 2 points
function getSqDist(p1: Coord, p2: Coord) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDist(p: Coord, p1: Coord, p2: Coord) {
  let [x, y] = p1;
  let dx = p2[0] - x;
  let dy = p2[1] - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      [x, y] = p2;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;

  return dx * dx + dy * dy;
}
// rest of the code doesn't care about point format

// basic distance-based simplification
function simplifyRadialDist(points: Coord[], sqTolerance: number) {
  let prevPoint = points[0];
  const newPoints = [prevPoint];
  let point: Coord | undefined;

  for (let i = 1, len = points.length; i < len; i += 1) {
    point = points[i];

    if (getSqDist(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) newPoints.push(point!);

  return newPoints;
}

function simplifyDPStep(
  points: Coord[],
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Coord[],
) {
  let maxSqDist = sqTolerance;
  let index: number;

  for (let i = first + 1; i < last; i += 1) {
    const sqDist = getSqSegDist(points[i], points[first], points[last]);

    if (sqDist > maxSqDist) {
      index = i;
      maxSqDist = sqDist;
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index! - first > 1) {
      simplifyDPStep(points, first, index!, sqTolerance, simplified);
    }
    simplified.push(points[index!]);
    if (last - index! > 1) {
      simplifyDPStep(points, index!, last, sqTolerance, simplified);
    }
  }
}

// simplification using Ramer-Douglas-Peucker algorithm
function simplifyDouglasPeucker(points: Coord[], sqTolerance: number) {
  const last = points.length - 1;

  const simplified = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  return simplified;
}

// both algorithms combined for awesome performance
export function simplify(
  points: Coord[],
  tolerance?: number,
  highestQuality?: boolean,
): Coord[] {
  if (points.length <= 2) return points;

  const sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

  return simplifyDouglasPeucker(
    highestQuality ? points : simplifyRadialDist(points, sqTolerance),
    sqTolerance,
  );
}
