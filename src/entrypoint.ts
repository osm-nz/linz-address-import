import {
  type Callbacks,
  type RunOptions,
  run,
} from '@osm-conflation-engine/cli';
import type { Point } from 'geojson';
import type { LinzAddr } from './types.js';
import { config } from './config.js';
import { isImportUser } from './common/accounts.js';
import { processWithoutRef as create } from './conflate/processWithoutRef.js';
import { mergeOneToOne } from './conflate/processWithRef.js';
import { mergeOneToMany } from './action/handlers/handleDuplicateLinzRef.js';
import { mergeManyToOne } from './conflate/mergeManyToOne.js';
import { mergeManyToMany } from './conflate/mergeManyToMany.js';
import { deleteFeature } from './conflate/deleteFeature.js';
import { printReports } from './conflate/report.js';
import { postprocessLayer } from './action/handlers/existsButDataWrong.js';
import { generateStats } from './action/generateStats.js';
import { getLocalKeyForOsm, getLocalKeyForSource } from './localKeys.js';
import { getChangesetTags } from './getChangesetTags.js';

export async function entrypoint(runOptions: RunOptions) {
  const callbacks: Callbacks<Point, LinzAddr> = {
    getLocalKeyForOsm,
    getLocalKeyForSource,
    isImportUser,

    create,
    mergeOneToOne,
    mergeManyToOne,
    mergeOneToMany,
    mergeManyToMany,
    deleteFeature,

    postprocessLayer,
    getChangesetTags,
  };

  const runResult = await run(config, callbacks, runOptions);

  if (runResult.conflate) {
    await printReports();
    await generateStats(runResult.conflate);
  }
}
