import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import fetch from 'node-fetch';
import { StatsFile, GH } from '../types';

export async function uploadStatsToGH(): Promise<void> {
  const stats: StatsFile = JSON.parse(
    await fs.readFile(join(__dirname, `../../out/stats.json`), 'utf8'),
  );

  const { GH_BASIC_AUTH } = process.env;
  if (!GH_BASIC_AUTH) throw new Error(`No GH_BASIC_AUTH env variable set`);

  const url = `https://${GH_BASIC_AUTH}@api.github.com/repos/osm-nz/linz-address-import/issues/1`;

  const { body } = (await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  }).then((r) => r.json())) as GH.Issue;

  const date = stats.date.split('T')[0];
  const numbers: (string | number)[] = Object.values(stats.count);

  numbers.splice(11, 0, ''); // gap because we deleted status code 12

  const newLine = `|${[
    date,
    '?',
    ...numbers, // multiple columns,
    stats.total,
    '', // comment column
  ].join('|')}|`;

  // don't create a duplicate row. the date is in the row so this is safe
  if (body.includes(newLine)) {
    console.log('No change in statistics, not updating table');
    return;
  }

  const updatedBody = `${body.trim()}\n${newLine}`;

  const { status } = await fetch(url, {
    method: 'PATCH',
    headers: { Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify({ body: updatedBody }),
  });
  if (status !== 200) throw new Error(`HTTP ${status} from PATCH`);
}
