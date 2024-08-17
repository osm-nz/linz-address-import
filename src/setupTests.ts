import { config as dotenv } from 'dotenv';
import type { Mock } from 'vitest';

dotenv();

// @ts-expect-error -- it works
globalThis.m = <T>(x: T) => x as never as Mock<T>;

declare global {
  /** does nothing, just tells typescript that this function is mocked. For use in unit tests only */
  function m(x: unknown): Mock;
}
