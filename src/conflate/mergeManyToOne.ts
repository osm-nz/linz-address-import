import type { CallbackFunctions } from '../types.js';
import { handleCorrupted } from './handleCorrupted.js';
import { checkStackedAddr } from './checkStackedAddr.js';

export const mergeManyToOne: CallbackFunctions['mergeManyToOne'] = ({
  osm,
  source,
}) => {
  const stackedResult = checkStackedAddr(osm, source);
  if (stackedResult) return stackedResult;

  return handleCorrupted({ osm, source });
};
