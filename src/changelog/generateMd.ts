import { promises as fs } from 'fs';
import { nzgbFile } from '../preprocess/const';
import { ChangelogJson } from '../types';

/** this gets stringified and stuck in the issue comment */
export type Diags = {
  version: string;
};

function section(
  name: string,
  sectors: Record<string, number>,
  nzgb: Record<string, string>,
) {
  const count = Object.values(sectors).reduce((ac, t) => ac + t, 0);
  if (!count) return '';

  return `<details><summary>${name} (${count})</summary><ul>
${Object.entries(sectors)
  .sort(([, a], [, b]) => b - a)
  .map(([sName, sCount]) => `<li>${nzgb[sName] || sName} (${sCount})</li>`)
  .join('')}
<ul></details>`;
}

export async function generateMd({
  version,
  date,
  json,
}: {
  version: string;
  date: string;
  json: ChangelogJson;
}): Promise<string> {
  const nzgb: Record<string, string> = JSON.parse(
    await fs.readFile(nzgbFile, 'utf-8'),
  );

  const diags: Diags = { version };
  const niceDate = new Date(date).toLocaleDateString('en-nz', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  });
  return `## \`v${version}\` - ${niceDate}

- [ ] available to import

${section('Added', json.add, nzgb)}
${section('Updated', json.update, nzgb)}
${section('Deleted', json.delete, nzgb)}

<!-- DO NOT EDIT THIS COMMENT 🌏${JSON.stringify(diags)}🌏 -->
`;
}
