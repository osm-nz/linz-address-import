import { getIDToken } from '@actions/core';
import { run } from '@osm-conflation-engine/changeset-watcher';
import { isImportUser } from '../common/accounts.js';
import { REF_TAG } from '../config.js';
import { watchArea } from './constants.js';

await run({
  authToken: await getIDToken('osm-conflation-engine'),
  refTag: REF_TAG,
  watchArea,
  isImportUser,
  getLocalKey({ tags }) {
    return `${tags?.['addr:housenumber']} ${tags?.['addr:street']}`;
  },
  getLabel({ tags }) {
    return tags?.['addr:suburb'] || tags?.['addr:hamlet'] || '';
  },
});
