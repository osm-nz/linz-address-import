import type { CallbackFunctions } from '../types.js';

export const mergeManyToMany: CallbackFunctions['mergeManyToMany'] = () => {
  // do not attempt to autofix
  return undefined;
};
