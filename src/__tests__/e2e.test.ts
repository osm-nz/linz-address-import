import { execSync } from 'node:child_process';
import { setTimeout } from 'node:timers/promises';
import { join } from 'node:path';
import { promises as fs } from 'node:fs';
import { main as preprocessLinz } from '../preprocess/processLinzData.js';
import { main as stackLinzData } from '../preprocess/stackLinzData.js';
import { entrypoint } from '../entrypoint.js';
import { outFolder } from '../conflate/helpers/const.js';

const joinPath = (...files: string[]) => join(import.meta.dirname, ...files);

async function time(f: () => unknown) {
  const start = Date.now();
  await f();
  return (Date.now() - start) / 1000 / 60;
}

describe('end-to-end test', () => {
  // convert the mock.xml file into mock.pbf
  beforeAll(() => {
    const std = execSync(
      `osmium cat ${joinPath('mock/planet.xml')} -o ${joinPath('mock/planet.pbf')} --overwrite`,
    );
    process.stdout.write(std);
  });

  it('works', async () => {
    await fs.rm(outFolder, { recursive: true, force: true });
    await fs.mkdir(outFolder);
    expect(await time(() => entrypoint({ steps: ['download'] }))).toBeLessThan(
      0.5,
    );

    expect(await time(preprocessLinz)).toBeLessThan(0.5);

    expect(await time(stackLinzData)).toBeLessThan(0.5);

    expect(
      await time(() => entrypoint({ steps: ['match', 'conflate'] })),
    ).toBeLessThan(0.5);

    // this file contains unstable stuff, like absolute paths on disk.
    // so we need to delete that from the snapshot tests.
    const metricsPath = joinPath('snapshot/metrics.json');
    const metrics = await JSON.parse(await fs.readFile(metricsPath, 'utf8'));
    metrics.config = null;
    await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));

    // need to wait for git to re-calculate the diff
    await setTimeout(1000);

    const anyUncommitedChanges = !!execSync('git status --porcelain')
      .toString()
      .replace('\n', '');

    if (anyUncommitedChanges) {
      throw new Error('Tests failed because some files were modified');
    }
  });
});
