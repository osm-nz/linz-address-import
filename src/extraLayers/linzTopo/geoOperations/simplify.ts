//
// modified from npm.im/simplify-js
// example: https://github.com/osm-nz/linz-address-import/blob/main/src/extraLayers/linzTopo/geoOperations/__tests__/simplify.geo.json
//

type Coord = [x: number, y: number];

// to suit your point format, run search/replace for '.x' and '.y';
// for 3D version, see 3d branch (configurability would draw significant performance overhead)

// square distance between 2 points
function getSqDistance(p1: Coord, p2: Coord) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];

  return dx * dx + dy * dy;
}

// square distance from a point to a segment
function getSqSegDistance(p: Coord, p1: Coord, p2: Coord) {
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
function simplifyRadialDistance(points: Coord[], sqTolerance: number) {
  let previousPoint = points[0];
  const newPoints = [previousPoint];
  let point: Coord | undefined;

  for (let index = 1, length_ = points.length; index < length_; index += 1) {
    point = points[index];

    if (getSqDistance(point, previousPoint) > sqTolerance) {
      newPoints.push(point);
      previousPoint = point;
    }
  }

  if (previousPoint !== point) newPoints.push(point!);

  return newPoints;
}

function simplifyDPStep(
  points: Coord[],
  first: number,
  last: number,
  sqTolerance: number,
  simplified: Coord[],
) {
  let maxSqDistance = sqTolerance;
  let index: number;

  for (let index_ = first + 1; index_ < last; index_ += 1) {
    const sqDistance = getSqSegDistance(
      points[index_],
      points[first],
      points[last],
    );

    if (sqDistance > maxSqDistance) {
      index = index_;
      maxSqDistance = sqDistance;
    }
  }

  if (maxSqDistance > sqTolerance) {
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

  const sqTolerance = tolerance === undefined ? 1 : tolerance * tolerance;

  return simplifyDouglasPeucker(
    highestQuality ? points : simplifyRadialDistance(points, sqTolerance),
    sqTolerance,
  );
}
