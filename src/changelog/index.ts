import { config as dotenv } from 'dotenv';
import { generateMd } from './generateMd';
import { getLatestKnownVersion, addComment } from './github';
import { processChangelog } from './processChangelog';

dotenv();

async function main() {
  const latestKnownVersion = await getLatestKnownVersion();
  const data = await processChangelog(latestKnownVersion);

  if (!data) {
    console.log(`v${latestKnownVersion} is already known.`);
    return;
  }

  const md = generateMd(data);
  await addComment(md);
  console.log('Left a comment');
}
main();
