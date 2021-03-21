/** radius of the diamond */
const RADIUS = 0.0002;

/** generates a bbox around a point, but as a diamond not a square */
export function createDiamond({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}): [ring1: [lng: number, lat: number][]] {
  const diamond: [lng: number, lat: number][] = [
    [lng, lat + RADIUS], // top
    [lng + RADIUS, lat], // right
    [lng, lat - RADIUS], // bottom
    [lng - RADIUS, lat], // left
  ];
  diamond.push(diamond[0]); // make it a closed way

  return [diamond]; // only 1 ring since it's an area, not a multipolygon
}
