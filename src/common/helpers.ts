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

export const timeout = (ms: number): Promise<void> =>
  new Promise((cb) => setTimeout(cb, ms));

/** checks if an ISO date exists and if it it's less than 2 years old */
export const isChecked = (v: string | undefined): boolean =>
  !!v && (+new Date() - +new Date(v)) / 1000 / 60 / 60 / 24 / 365 < 2;
