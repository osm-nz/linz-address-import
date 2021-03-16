import fetch from 'node-fetch';
import { promises as fs, createReadStream } from 'fs';
import { join } from 'path';
import csv from 'csv-parser';

const FROM_DATE = '2017-12-17T09:22:31.538834Z'; // compare with v66, the first version ever imported into OSM

const mock = process.env.NODE_ENV === 'test' ? '-mock' : '';

const output = join(__dirname, `../../data/linz-deletions${mock}.json`);

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
  const lastUpdateDate = xml.match(/<published>(.+)<\/published>/)?.[1];

  if (!lastUpdateDate) {
    throw new Error("Failed to parse LINZ's RSS changelog");
  }

  // fix dodgy python ISO date returned. needs to end in `.12345Z` not `+12:34`
  return new Date(lastUpdateDate).toISOString();
}

// perf baseline is 17seconds (most of that is waiting for LINZ's API)
async function fetchLinzChangesCsv(
  lastUpdateDate: string,
): Promise<[linzId: string, suburb: string][]> {
  const { LINZ_API_KEY } = process.env;
  if (!LINZ_API_KEY) throw new Error('No LINZ_API_KEY env variable');

  const stream = mock
    ? createReadStream(join(__dirname, '../__tests__/mock/linz-deletions.csv'))
    : await fetch(
        `https://data.linz.govt.nz/services;key=${LINZ_API_KEY}/wfs/layer-53353-changeset?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&typeNames=layer-53353-changeset&viewparams=from:${FROM_DATE};to:${lastUpdateDate}&outputFormat=csv`,
      ).then((r) => r.body);

  return new Promise((resolve, reject) => {
    const out: [linzId: string, suburb: string][] = [];

    stream
      .pipe(csv())
      .on('data', (data) => {
        // we only care about delete, rest of the info comes from the latest linz dump
        if (data.__change__ !== 'DELETE') return; // eslint-disable-line no-underscore-dangle
        out.push([data.address_id, data.suburb_locality]);
      })
      .on('end', () => resolve(out))
      .on('error', reject);
  });
}

export async function processDeletedData(): Promise<void> {
  const lastUpdateDate = await fetchLinzChangelogRss();
  const res = await fetchLinzChangesCsv(lastUpdateDate);

  await fs.writeFile(output, JSON.stringify(res));
}
