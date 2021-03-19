import { promises as fs } from 'fs';
import fetch from 'node-fetch';
import { join } from 'path';
import { StatsFile, LinzMetaFile } from '../types';

type Issue = { body: string };

export async function uploadStatsToGH(): Promise<void> {
  const stats: StatsFile = JSON.parse(
    await fs.readFile(join(__dirname, `../../out/stats.json`), 'utf-8'),
  );
  const linzMeta: LinzMetaFile = JSON.parse(
    await fs.readFile(join(__dirname, `../../data/linz-meta.json`), 'utf-8'),
  );

  const { GH_BASIC_AUTH } = process.env;
  if (!GH_BASIC_AUTH) throw new Error(`No GH_BASIC_AUTH env variable set`);

  const url = `https://${GH_BASIC_AUTH}@api.github.com/repos/osm-nz/linz-address-import/issues/1`;

  const { body }: Issue = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  }).then((r) => r.json());

  const date = stats.date.split('T')[0];
  const numbers = Object.values(stats.count);

  const updatedBody = `${body.trim()}\n|${[
    date,
    linzMeta.version,
    ...numbers, // multiple columns,
    stats.total,
    '', // comment column
  ].join('|')}|`;

  const { status } = await fetch(url, {
    method: 'PATCH',
    headers: { Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify({ body: updatedBody }),
  });
  if (status !== 200) throw new Error(`HTTP ${status} from PATCH`);
}

uploadStatsToGH();
