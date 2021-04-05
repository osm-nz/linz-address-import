import fetch from 'node-fetch';
import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';
import { ChangelogJson, LinzChangelog } from '../types';

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

const MAP = <const>{
  INSERT: 'add',
  UPDATE: 'update',
  DELETE: 'delete',
};

type LinzChangelogRss = {
  version: string;
  data: {
    published_at: string;
  }[];
};

async function fetchLinzChangelogRss(LINZ_API_KEY: string) {
  const json: LinzChangelogRss = mock
    ? JSON.parse(
        await fs.readFile(
          join(__dirname, '../__tests__/mock/linz-changelog.json'),
          'utf8',
        ),
      )
    : await fetch(
        `https://data.linz.govt.nz/services/api/v1/layers/53353/versions/?page_size=5&key=${LINZ_API_KEY}&format=json`,
        { headers: { expand: 'list' } },
      ).then(async (r) => ({
        data: await r.json(),
        version: r.headers.get('X-Resource-Range')?.split('/')[1],
      }));

  const lastUpdate = json.data[0].published_at;
  const secondLastUpdate = json.data[1].published_at;
  const { version } = json;

  if (!lastUpdate || !secondLastUpdate || !version) {
    throw new Error("Failed to parse LINZ's RSS changelog");
  }

  return {
    to: lastUpdate,
    from: secondLastUpdate,
    version,
  };
}

// perf baseline is 17seconds (most of that is waiting for LINZ's API)
async function processLinzChangelogCsv(
  LINZ_API_KEY: string,
  { from, to }: { from: string; to: string },
): Promise<ChangelogJson> {
  const stream = mock
    ? createReadStream(join(__dirname, '../__tests__/mock/linz-changelog.csv'))
    : await fetch(
        `https://data.linz.govt.nz/services;key=${LINZ_API_KEY}/wfs/layer-53353-changeset?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typeNames=layer-53353-changeset&viewparams=from:${from};to:${to}&outputFormat=csv`,
      ).then((r) => r.body);

  return new Promise((resolve, reject) => {
    const out: ChangelogJson = {
      add: {},
      update: {},
      delete: {},
    };

    stream
      .pipe(csv())
      .on('data', (data: LinzChangelog) => {
        const type = MAP[data.__change__]; // eslint-disable-line no-underscore-dangle
        out[type][data.suburb_locality] ??= 0;
        out[type][data.suburb_locality] += 1;
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function processChangelog(
  latestKnownVersion: string,
): Promise<
  | undefined
  | {
      version: string;
      date: string;
      json: ChangelogJson;
    }
> {
  const { LINZ_API_KEY } = process.env;
  if (!LINZ_API_KEY) throw new Error('No LINZ_API_KEY env variable');

  console.log('fetching rss...');
  const { from, to, version } = await fetchLinzChangelogRss(LINZ_API_KEY);
  console.log(`Last version is ${version} (from ${from} to ${to})`);

  // we've already left a comment for this version, so exit now
  if (version === latestKnownVersion) return undefined;

  console.log(version, 'is a new version, fetching csv...');
  const json = await processLinzChangelogCsv(LINZ_API_KEY, { from, to });

  return { version, date: to, json };
}
