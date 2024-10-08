import type { GH } from '../types.js';
import type { Diags } from './generateMd.js';

const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(new Date().getMonth() - 2);

function getUrl() {
  const options = {
    since: twoMonthsAgo.toISOString(),
    sort: 'created',
    direction: 'asc',
    per_page: '100',
  };
  const qs = new URLSearchParams(options).toString();
  return `https://api.github.com/repos/osm-nz/linz-address-import/issues/3/comments?${qs}`;
}

export async function getLatestKnownVersion(): Promise<string> {
  const comments = (await fetch(getUrl(), {
    headers: { Accept: 'application/vnd.github.v3+json' },
  }).then((r) => r.json())) as GH.IssueComment[];

  const { body: latestCommentBody } = comments.at(-1)!;

  const diags: Diags = JSON.parse(latestCommentBody.split('🌏')[1]);
  console.log('Found diagnostics', diags);

  return diags.version;
}

export async function addComment(body: string): Promise<void> {
  const { GH_BASIC_AUTH } = process.env;
  if (!GH_BASIC_AUTH) throw new Error(`No GH_BASIC_AUTH env variable set`);

  const result = await fetch(getUrl(), {
    method: 'post',
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Basic ${btoa(GH_BASIC_AUTH)}`,
    },
    body: JSON.stringify({ body }),
  }).then((r) => r.json() as Promise<{ url: string }>);

  if (!result.url) {
    throw new Error(`Failed to leave comment: ${JSON.stringify(result)}`);
  }
}
