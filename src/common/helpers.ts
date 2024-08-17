import { CheckDate } from '../types.js';

/** number of years before we revisit a feature with check_date */
const CHECK_DATE_THRESHOLD_YEARS = 4;

export const chunk = <T>(list: T[], size: number): T[][] =>
  list.reduce<T[][]>(
    (r, v) =>
      ((!r.length || r.at(-1)!.length === size
        ? r.push([v])
        : r.at(-1)!.push(v)) && r) as T[][],
    [],
  );

export function uniq<T>(value: T, index: number, self: T[]): boolean {
  return self.indexOf(value) === index;
}

export const timeout = (ms: number): Promise<void> =>
  new Promise((callback) => setTimeout(callback, ms));

/** checks if an ISO date exists and if it it's less than X years old */
export const isChecked = (v: string | undefined): CheckDate => {
  if (!v) return CheckDate.No;

  const yearsAgo = (Date.now() - +new Date(v)) / 1000 / 60 / 60 / 24 / 365;
  return yearsAgo < CHECK_DATE_THRESHOLD_YEARS
    ? CheckDate.YesRecent
    : CheckDate.YesExpired;
};
