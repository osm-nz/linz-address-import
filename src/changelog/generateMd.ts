import { nzgbNamesTable as nzgb } from '../common/nzgbFile';
import { ChangelogJson } from '../types';

/** this gets stringified and stuck in the issue comment */
export type Diags = {
  version: string;
};

function section(name: string, sectors: Record<string, number>) {
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
  const diags: Diags = { version };
  const niceDate = new Date(date).toLocaleDateString('en-nz', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  });
  return `## \`v${version}\` - ${niceDate}

- [ ] available to import

${section('Added', json.add)}
${section('Updated', json.update)}
${section('Deleted', json.delete)}

<!-- DO NOT EDIT THIS COMMENT 🌏${JSON.stringify(diags)}🌏 -->
`;
}
