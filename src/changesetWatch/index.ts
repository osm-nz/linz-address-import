import { configure, getChangesetDiff, listChangesets } from 'osm-api';
import { config as dotenv } from 'dotenv';
import { watchArea } from './constants';
import { fetchIgnoreList } from '../preprocess/fetchIgnoreList';
import { updateIgnoreList, updateLastCheckDate } from './api';
import { timeout } from '../common';
import { CSWithDiff, patchOsmChange } from './patchOsmChange';
import { checkDiffsForAddress } from './checkDiffsForAddress';

dotenv();

configure({
  userAgent: 'LINZ Address Import (https://wiki.osm.org/LINZ)',
});

async function main() {
  const lastCheck = Object.keys(
    await fetchIgnoreList(604906144, 'Last Check'),
  )[0];

  console.log(`Fetching changeset list since ${lastCheck}...`);
  const allChangesets = await listChangesets({
    bbox: watchArea,
    only: 'closed',
    time: lastCheck,
  });

  const csToInspect = allChangesets.filter((c) => !c.user.endsWith('_linz'));
  console.log(
    `Going to inspect ${csToInspect.length}/${allChangesets.length} changesets`,
  );

  const diffs: CSWithDiff[] = [];

  // check each changeset
  for (const [i, cs] of csToInspect.entries()) {
    console.log('Fetching...', cs.id);
    try {
      const diff = await getChangesetDiff(cs.id);

      if (diff.delete.length > 1000) {
        console.log(`Skipping changeset ${cs.id} which deleted >1000 features`);
        continue; // eslint-disable-line no-continue
      }

      diffs.push({ cs, diff });
    } catch (ex) {
      console.error(ex);
      console.log(`Failed to fetch cs${cs.id}. Waiting...`);
      // wait for ages to give the API some time
      await timeout(20_000);
    }

    if (!(i % 10)) {
      // we don't want to spam the OSM api, so every 10 API requets we wait a bit.
      console.log('Waiting...');
      await timeout(7_000);
    }
  }

  const diffsWithDeletedTags = await patchOsmChange(diffs);

  const addrIssues = checkDiffsForAddress(diffsWithDeletedTags);

  console.log('Total issues:', addrIssues.length);

  // save the results of these changesets
  await updateIgnoreList(addrIssues);

  // done
  await updateLastCheckDate(lastCheck);
}

main();
