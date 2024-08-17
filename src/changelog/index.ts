import { config as dotenv } from 'dotenv';
import { generateMd } from './generateMd.js';
import { addComment, getLatestKnownVersion } from './github.js';
import { processChangelog } from './processChangelog.js';

dotenv();

async function main() {
  const latestKnownVersion = await getLatestKnownVersion();
  const data = await processChangelog(latestKnownVersion);

  if (!data) {
    console.log(`v${latestKnownVersion} is already known.`);
    return;
  }

  const md = await generateMd(data);
  await addComment(md);
  console.log('Left a comment');
}
main();
