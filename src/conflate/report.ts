import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Status } from '../types.js';
import { outFolder } from './helpers/const.js';

const reports: Record<Status, { [suburb: string]: string[] }> = {
  [Status.PERFECT]: {}, // not used
  [Status.EXISTS_BUT_WRONG_DATA]: {},
  [Status.EXISTS_BUT_NO_LINZ_REF]: {},
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: {},
  [Status.MULTIPLE_EXIST]: {},
  [Status.EXISTS_BUT_LOCATION_WRONG]: {},
  [Status.TOTALLY_MISSING]: {}, // not used
  [Status.NEEDS_DELETE]: {},
  [Status.NEEDS_DELETE_NON_TRIVIAL]: {},
  [Status.CORRUPT]: {},
  [Status.LINZ_REF_CHANGED]: {},
  [Status.NEEDS_DELETE_ON_BUILDING]: {},
  [Status.REPLACED_BY_BUILDING]: {},
};

const REPORT_FILE_NAMES: Record<string, Status> = {
  'data-wrong.txt': Status.EXISTS_BUT_WRONG_DATA,
  'corrupt.txt': Status.CORRUPT,
  // 'could-be-stacked.txt' is generated at preprocess-time
  'needs-delete.txt': Status.NEEDS_DELETE,
  'needs-delete-on-building.txt': Status.NEEDS_DELETE_ON_BUILDING,
  'needs-delete-non-trivial.txt': Status.NEEDS_DELETE_NON_TRIVIAL,
  'duplicate-linz-ref.txt': Status.MULTIPLE_EXIST,
  'needs-linz-ref.txt': Status.EXISTS_BUT_NO_LINZ_REF,
  'linz-ref-changed.txt': Status.LINZ_REF_CHANGED,
  'location-wrong.txt': Status.EXISTS_BUT_LOCATION_WRONG,
  'needs-linz-ref-but-multiple.txt': Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF,
};

const REPORT_PREFIXES: Partial<Record<Status, string>> = {
  [Status.MULTIPLE_EXIST]: [
    '✅ = issue can be autofixed',
    '⚠️ = issue can be partially autofixed',
    '❌ = issue cannot be autofixed',
    '',
  ].join('\n'),
};

export function addToReport(status: Status, suburb: string, row: string) {
  reports[status][suburb] ||= [];
  reports[status][suburb].push(row);
}

/** writes the collected data to the .txt files */
export async function printReports() {
  for (const fileName in REPORT_FILE_NAMES) {
    const status = REPORT_FILE_NAMES[fileName];
    let report = REPORT_PREFIXES[status] || '';
    for (const suburb of Object.keys(reports[status])) {
      report += `\n${suburb}\n`;
      const rows = reports[status][suburb];
      report += rows.join('\n');
      report += '\n';
    }
    await fs.writeFile(join(outFolder, fileName), report);
  }
}

export function getReportCounts() {
  const counts: Record<Status, number> = {
    [Status.PERFECT]: 0,
    [Status.EXISTS_BUT_WRONG_DATA]: 0,
    [Status.EXISTS_BUT_NO_LINZ_REF]: 0,
    [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: 0,
    [Status.MULTIPLE_EXIST]: 0,
    [Status.EXISTS_BUT_LOCATION_WRONG]: 0,
    [Status.TOTALLY_MISSING]: 0,
    [Status.NEEDS_DELETE]: 0,
    [Status.NEEDS_DELETE_NON_TRIVIAL]: 0,
    [Status.CORRUPT]: 0,
    [Status.LINZ_REF_CHANGED]: 0,
    [Status.NEEDS_DELETE_ON_BUILDING]: 0,
    [Status.REPLACED_BY_BUILDING]: 0,
  };
  for (const _status in reports) {
    const status = <Status>+_status;
    for (const suburb in reports[status]) {
      counts[status] += reports[status][suburb].length;
    }
  }
  return counts;
}
