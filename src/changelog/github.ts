import fetch from 'node-fetch';
import { GH } from '../types';
import { Diags } from './generateMd';

const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(new Date().getMonth() - 2);

function getUrl() {
  const { GH_BASIC_AUTH } = process.env;
  if (!GH_BASIC_AUTH) throw new Error(`No GH_BASIC_AUTH env variable set`);

  return `https://${GH_BASIC_AUTH}@api.github.com/repos/osm-nz/linz-address-import/issues/3/comments?since=${twoMonthsAgo.toISOString()}`;
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
  const result = await fetch(getUrl(), {
    method: 'post',
    headers: { Accept: 'application/vnd.github.v3+json' },
    body: JSON.stringify({ body }),
  }).then((r) => r.json());

  if (!result.url) {
    throw new Error(`Failed to leave comment: ${JSON.stringify(result)}`);
  }
}
