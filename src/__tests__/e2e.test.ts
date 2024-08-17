import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { main as fetchAndSaveAddressIgnoreList } from '../preprocess/fetchAndSaveAddressIgnoreList.js';
import { main as preprocessLinz } from '../preprocess/processLinzData.js';
import { main as preprocessOsm } from '../preprocess/processOsmData.js';
import { main as stackLinzData } from '../preprocess/stackLinzData.js';
import { main as conflate } from '../conflate/index.js';
import { main as action } from '../action/index.js';

const joinPath = (...files: string[]) => join(__dirname, ...files);

async function time(f: () => unknown) {
  const start = Date.now();
  await f();
  return (Date.now() - start) / 1000 / 60;
}

const exe = joinPath(
  'bin',
  process.platform === 'win32' ? 'osmconvert.exe' : 'osmconvert2',
);

describe('end-to-end test', () => {
  // convert the mock.xml file into mock.pbf
  beforeAll(() => {
    const std = execSync(
      `${exe} ${joinPath('mock/planet.xml')} -o=${joinPath('mock/planet.pbf')}`,
    );
    process.stdout.write(std);
  });

  it('works', async () => {
    expect(await time(fetchAndSaveAddressIgnoreList)).toBeLessThan(0.5);

    expect(await time(preprocessOsm)).toBeLessThan(0.5);

    expect(await time(preprocessLinz)).toBeLessThan(0.5);

    expect(await time(stackLinzData)).toBeLessThan(0.5);

    expect(await time(conflate)).toBeLessThan(0.5);

    expect(await time(action)).toBeLessThan(0.5);

    const anyUncommitedChanges = !!execSync('git status --porcelain')
      .toString()
      .replace('\n', '');

    if (anyUncommitedChanges) {
      throw new Error('Tests failed because some files were modified');
    }
  });
});
