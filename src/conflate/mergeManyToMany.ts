import { type CallbackFunctions, Status } from '../types.js';
import { toLink } from './helpers/const.js';
import { addToReport } from './report.js';

export const mergeManyToMany: CallbackFunctions['mergeManyToMany'] = ({
  osm,
  source,
}) => {
  addToReport(
    Status.CORRUPT,
    source[0].properties.suburb,
    `${source
      .map((linzAddr) => linzAddr.properties.id)
      .join(
        ' and ',
      )}\t\tare on the same node (many:many)\t\t${osm.map((osmAddr) => toLink(osmAddr.id))}`,
  );

  // do not attempt to autofix
  return undefined;
};
