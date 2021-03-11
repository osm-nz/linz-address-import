import { Status } from '../../types';
import { existsButDataWrong } from './existsButDataWrong';
import { handleDeleted } from './handleDeleted';
import { handleDuplicateLinzRef } from './handleDuplicateLinzRef';
import { handleExistsButNoLinzRef } from './handleExistsButNoLinzRef';
import { handleLocationWrong } from './handleLocationWrong';
import { handleMultipleExistButNoLinzRef } from './handleMultipleExistButNoLinzRef';
import { handleTotallyMissing } from './handleTotallyMissing';

export const handlers: Record<Status, (data: any) => Promise<void>> = {
  [Status.PERFECT]: async () => undefined,
  [Status.EXISTS_BUT_WRONG_DATA]: existsButDataWrong,
  [Status.EXISTS_BUT_NO_LINZ_REF]: handleExistsButNoLinzRef,
  [Status.MULTIPLE_EXIST_BUT_NO_LINZ_REF]: handleMultipleExistButNoLinzRef,
  [Status.MULTIPLE_EXIST]: handleDuplicateLinzRef,
  [Status.EXISTS_BUT_LOCATION_WRONG]: handleLocationWrong,
  [Status.TOTALLY_MISSING]: handleTotallyMissing,
  [Status.NEEDS_DELETE]: handleDeleted,
};
