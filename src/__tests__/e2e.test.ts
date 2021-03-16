import { execSync } from 'child_process';
import { join } from 'path';
import { main as preprocess } from '../preprocess';
import { main as conflate } from '../conflate';
import { main as action } from '../action';

const j = (...files: string[]) => join(__dirname, ...files);

async function time(f: () => unknown) {
  const start = Date.now();
  await f();
  return (Date.now() - start) / 1000 / 60;
}

const exe = j(
  'bin',
  process.platform === 'win32' ? 'osmconvert.exe' : 'osmconvert',
);

describe('end-to-end test', () => {
  // convert the mock.xml file into mock.pbf
  beforeAll(() => {
    const std = execSync(
      `${exe} ${j('mock/planet.xml')} -o=${j('mock/planet.pbf')}`,
    );
    process.stdout.write(std);
  });

  it('works', async () => {
    expect(await time(preprocess)).toBeLessThan(0.5);

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
