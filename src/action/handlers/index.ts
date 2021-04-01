import { HandlerReturn, Status, StatusReport } from '../../types';
import { existsButDataWrong } from './existsButDataWrong';
import { handleCorrupted } from './handleCorrupted';
import { handleDeleted } from './handleDeleted';
import { handleDeletedOnBuilding } from './handleDeletedOnBuilding';
import { handleDuplicateLinzRef } from './handleDuplicateLinzRef';
import { handleExistsButNoLinzRef } from './handleExistsButNoLinzRef';
import { handleLinzRefChanged } from './handleLinzRefChanged';
import { handleLocationWrong } from './handleLocationWrong';
import { handleMultipleExistButNoLinzRef } from './handleMultipleExistButNoLinzRef';
import { handleTotallyMissing } from './handleTotallyMissing';

export const handlers: Record<
  Status,
  (
    data: any,
    needsDeleteData: StatusReport[Status.NEEDS_DELETE],
  ) => Promise<void | HandlerReturn>
> = {
  [Status.PERFECT]: async () => undefined,
  [Status.EXISTS_BUT_WRONG_DATA]: existsButDataWrong,
  [Status.EXISTS_BUT_NO_LINZ_REF]: handleExistsButNoLinzRef,
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: handleMultipleExistButNoLinzRef,
  [Status.MULTIPLE_EXIST]: handleDuplicateLinzRef,
  [Status.EXISTS_BUT_LOCATION_WRONG]: handleLocationWrong,
  [Status.TOTALLY_MISSING]: handleTotallyMissing,
  [Status.NEEDS_DELETE]: handleDeleted,
  [Status.NEEDS_DELETE_NON_TRIVIAL]: handleDeletedOnBuilding,
  [Status.CORRUPT]: handleCorrupted,
  [Status.LINZ_REF_CHANGED]: handleLinzRefChanged,
};
