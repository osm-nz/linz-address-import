import {
  type Vec2,
  vecAdd,
  vecEqual,
  vecLength,
  vecNormalize,
  vecNormalizedDot,
  vecScale,
  vecSubtract,
} from '@id-sdk/vector';

//
// copied from https://github.com/openstreetmap/iD/blob/develop/modules/geo/ortho.js
//         and https://github.com/openstreetmap/iD/blob/develop/modules/actions/orthogonalize.js
//

const EPSILON = 1e-4;
const THRESHOLD = 13; // degrees within right or straight to alter

const clonePoints = (array: Vec2[]): Vec2[] => array.map((p) => [p[0], p[1]]);

export function geoOrthoNormalizedDotProduct(
  a: Vec2,
  b: Vec2,
  origin: Vec2,
): number {
  if (vecEqual(origin, a) || vecEqual(origin, b)) {
    return 1; // coincident points, treat as straight and try to remove
  }
  return vecNormalizedDot(a, b, origin);
}

function geoOrthoFilterDotProduct(
  dotp: number,
  epsilon: number,
  lowerThreshold: number,
  upperThreshold: number,
  allowStraightAngles = false,
) {
  const value = Math.abs(dotp);
  if (value < epsilon) {
    return 0; // already orthogonal
  }
  if (allowStraightAngles && Math.abs(value - 1) < epsilon) {
    return 0; // straight angle, which is okay in this case
  }
  if (value < lowerThreshold || value > upperThreshold) {
    return dotp; // can be adjusted
  }
  return null; // ignore vertex
}

export function geoOrthoCalcScore(
  points: Vec2[],
  isClosed: true,
  epsilon: number,
  threshold: number,
): number {
  let score = 0;
  const first = isClosed ? 0 : 1;
  const last = isClosed ? points.length : points.length - 1;

  const lowerThreshold = Math.cos(((90 - threshold) * Math.PI) / 180);
  const upperThreshold = Math.cos((threshold * Math.PI) / 180);

  for (let index = first; index < last; index += 1) {
    const a = points[(index - 1 + points.length) % points.length];
    const origin = points[index];
    const b = points[(index + 1) % points.length];

    const dotp = geoOrthoFilterDotProduct(
      geoOrthoNormalizedDotProduct(a, b, origin),
      epsilon,
      lowerThreshold,
      upperThreshold,
    );

    if (dotp === null) continue; // ignore vertex
    score +=
      2 *
      Math.min(
        Math.abs(dotp - 1),
        Math.min(Math.abs(dotp), Math.abs(dotp + 1)),
      );
  }

  return score;
}

/** only works on closed way. first node == last node */
export function orthogonalize(_points: Vec2[]): Vec2[] {
  const points = _points.slice(0, -1); // remove duplicate first/last node

  // We test normalized dot products so we can compare as cos(angle)
  const lowerThreshold = Math.cos(((90 - THRESHOLD) * Math.PI) / 180);
  const upperThreshold = Math.cos((THRESHOLD * Math.PI) / 180);

  const corner = { i: 0, dotp: 1 };

  function calcMotion(origin: Vec2, index2: number, array: Vec2[]): Vec2 {
    const a = array[(index2 - 1 + array.length) % array.length];
    const b = array[(index2 + 1) % array.length];
    let p = vecSubtract(a, origin);
    let q = vecSubtract(b, origin);

    const scale = 2 * Math.min(vecLength(p), vecLength(q));
    p = vecNormalize(p);
    q = vecNormalize(q);

    const dotp = p[0] * q[0] + p[1] * q[1];
    const value = Math.abs(dotp);

    if (value < lowerThreshold) {
      // nearly orthogonal
      corner.i = index2;
      corner.dotp = value;
      const vec = vecNormalize(vecAdd(p, q));
      return vecScale(vec, 0.1 * dotp * scale);
    }

    return [0, 0]; // do nothing
  }

  const straights: Vec2[] = [];
  const simplified: Vec2[] = [];

  // Remove points from nearly straight sections..
  // This produces a simplified shape to orthogonalize
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const a = points[(index - 1 + points.length) % points.length];
    const b = points[(index + 1) % points.length];
    const dotp = Math.abs(geoOrthoNormalizedDotProduct(a, b, point));

    if (dotp > upperThreshold) {
      straights.push(point);
    } else {
      simplified.push(point);
    }
  }

  // Orthogonalize the simplified shape
  let bestPoints = clonePoints(simplified);

  let score = Infinity;
  for (let index = 0; index < 1000; index += 1) {
    const motions = simplified.map(calcMotion);

    for (let jindex = 0; jindex < motions.length; jindex += 1) {
      simplified[jindex] = vecAdd(simplified[jindex], motions[jindex]);
    }
    const newScore = geoOrthoCalcScore(simplified, true, EPSILON, THRESHOLD);
    if (newScore < score) {
      bestPoints = clonePoints(simplified);
      score = newScore;
    }
    if (score < EPSILON) break;
  }

  bestPoints.push(bestPoints[0]);

  return bestPoints;
}
