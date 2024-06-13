import { generateMd } from '../generateMd';

describe('generateMd', () => {
  it('generates nice markdown', async () => {
    const input = {
      date: '2021-03-01T16:39:30.000Z',
      version: '123',
      json: {
        add: { Oakleigh: 1 },
        delete: { 'West Hoe Heights': 1, Opotiki: 2 },
        update: {},
      },
    };
    expect(await generateMd(input)).toMatchInlineSnapshot(`
      "## \`v123\` - 2 March 2021

      - [x] available to import

      <details><summary>Added (1)</summary><ul>
      <li>Oakleigh (1)</li>
      <ul></details>

      <details><summary>Deleted (3)</summary><ul>
      <li>Ōpōtiki (2)</li><li>West Hoe Heights (1)</li>
      <ul></details>

      <!-- DO NOT EDIT THIS COMMENT 🌏{"version":"123"}🌏 -->
      "
    `);
  });
});
