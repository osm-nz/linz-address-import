import { type HandlerReturn, Status, type StatusReport } from '../../types.js';
import { existsButDataWrong } from './existsButDataWrong.js';
import { handleCorrupted } from './handleCorrupted.js';
import { handleCouldBeStacked } from './handleCouldBeStacked.js';
import { handleDeleted } from './handleDeleted.js';
import { handleDeletedOnPOI } from './handleDeletedOnPOI.js';
import { handleDeletedOnBuilding } from './handleDeletedOnBuilding.js';
import { handleDuplicateLinzRef } from './handleDuplicateLinzRef.js';
import { handleExistsButNoLinzRef } from './handleExistsButNoLinzRef.js';
import { handleLinzRefChanged } from './handleLinzRefChanged.js';
import { handleLocationWrong } from './handleLocationWrong.js';
import { handleMultipleExistButNoLinzRef } from './handleMultipleExistButNoLinzRef.js';
import { handleTotallyMissing } from './handleTotallyMissing.js';
import { handleReplacedByBuilding } from './handleReplacedByBuilding.js';

export const handlers: {
  [T in Status]: (
    data: StatusReport[T],
    needsDeleteData: StatusReport[Status.NEEDS_DELETE],
  ) => Promise<void> | Promise<HandlerReturn>;
} = {
  [Status.PERFECT]: async () => undefined,
  [Status.EXISTS_BUT_WRONG_DATA]: existsButDataWrong,
  [Status.EXISTS_BUT_NO_LINZ_REF]: handleExistsButNoLinzRef,
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: handleMultipleExistButNoLinzRef,
  [Status.MULTIPLE_EXIST]: handleDuplicateLinzRef,
  [Status.EXISTS_BUT_LOCATION_WRONG]: handleLocationWrong,
  [Status.TOTALLY_MISSING]: handleTotallyMissing,
  [Status.NEEDS_DELETE]: handleDeleted,
  [Status.NEEDS_DELETE_NON_TRIVIAL]: handleDeletedOnPOI,
  [Status.CORRUPT]: handleCorrupted,
  [Status.LINZ_REF_CHANGED]: handleLinzRefChanged,
  [Status.COULD_BE_STACKED]: handleCouldBeStacked,
  [Status.NEEDS_DELETE_ON_BUILDING]: handleDeletedOnBuilding,
  [Status.REPLACED_BY_BUILDING]: handleReplacedByBuilding,
};
