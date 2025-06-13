/** e.g. `ā` -> `a` */
const withoutMacrons = (string: string) =>
  string.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '');

/**
 * Compares two strings while considering macrons.
 */
export const compareWithMacrons = (linz: string, osm: string) => {
  // eslint-disable-next-line unicorn/prefer-ternary -- more readable like this
  if (/[āēīōū]/i.test(linz)) {
    // LINZ has macrons, so the OSM name must exactly equal the linz value
    return linz === osm;
  } else {
    // LINZ does not have macrons, so allow OSM to use macrons inconsistently
    return withoutMacrons(linz) === withoutMacrons(osm);
  }
};
