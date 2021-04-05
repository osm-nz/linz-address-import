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

async function fetchLinzChangelogRss() {
  const xml = mock
    ? await fs.readFile(
        join(__dirname, '../__tests__/mock/linz-changelog.rss'),
        'utf8',
      )
    : await fetch(
        'https://data.linz.govt.nz/feeds/layers/53353/revisions',
      ).then((r) => r.text());

  // don't need an XML parser if all we want is this
  const [lastUpdate, secondLastUpdate] = [
    ...xml.matchAll(/<published>(.+)<\/published>/g),
  ].map((x) => x[1]);
  const version = xml.match(/Revision (.+)<\/title>/)?.[1];

  if (!lastUpdate || !secondLastUpdate || !version) {
    throw new Error("Failed to parse LINZ's RSS changelog");
  }

  // fix dodgy python ISO date returned. needs to end in `.12345Z` not `+12:34`
  return {
    to: new Date(lastUpdate).toISOString(),
    from: new Date(secondLastUpdate).toISOString(),
    version,
  };
}

// perf baseline is 17seconds (most of that is waiting for LINZ's API)
async function processLinzChangelogCsv({
  from,
  to,
}: {
  from: string;
  to: string;
}): Promise<ChangelogJson> {
  const { LINZ_API_KEY } = process.env;
  if (!LINZ_API_KEY) throw new Error('No LINZ_API_KEY env variable');

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
  console.log('fetching rss...');
  const { from, to, version } = await fetchLinzChangelogRss();

  // we've already left a comment for this version, so exit now
  if (version === latestKnownVersion) return undefined;

  console.log(version, 'is a new version, fetching csv...');
  const json = await processLinzChangelogCsv({ from, to });

  return { version, date: to, json };
}
