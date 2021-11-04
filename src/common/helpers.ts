export const chunk = <T>(list: T[], size: number): T[][] =>
  list.reduce<T[][]>(
    (r, v) =>
      ((!r.length || r[r.length - 1].length === size
        ? r.push([v])
        : r[r.length - 1].push(v)) && r) as T[][],
    [],
  );

export function uniq<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}
