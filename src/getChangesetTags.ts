import packageJson from '../package.json';
import {
  SPECIAL_REVIEW,
  SPECIAL_REVIEW_INFO,
} from './conflate/postprocessLayer.js';
import type { CallbackFunctions } from './types.js';

export const getChangesetTags: CallbackFunctions['getChangesetTags'] = ({
  category,
  group,
}) => {
  return {
    instructions: category === SPECIAL_REVIEW ? SPECIAL_REVIEW_INFO : undefined,
    changesetTags: {
      // various people have OSMCha filters with these tags hardcoded,
      // so we should avoid changing them for no good reason.
      attribution: 'https://wiki.openstreetmap.org/wiki/Contributors#LINZ',
      created_by: `LINZ Data Import ${packageJson.version}`,
      locale: 'en-NZ',
      source: 'https://wiki.osm.org/LINZ',
      comment: `${category} - ${group}`,
    },
  };
};
