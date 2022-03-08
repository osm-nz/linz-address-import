import { config as dotenv } from 'dotenv';

dotenv();

globalThis.m = <T>(x: T) => x as unknown as jest.Mock<T>;

declare global {
  /** does nothing, just tells typescript that this function is mocked. For use in unit tests only */
  function m(x: unknown): jest.Mock;
}
