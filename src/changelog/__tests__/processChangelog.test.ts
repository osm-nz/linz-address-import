import { processChangelog } from '../processChangelog.js';

process.env.LINZ_API_KEY = 'mock value';

describe('processChangelog', () => {
  it('returns the correct JSON', async () => {
    expect(await processChangelog('245')).toMatchInlineSnapshot(`
      {
        "date": "2021-03-12T13:37:56.287567Z",
        "json": {
          "add": {
            "Oakleigh": 1,
          },
          "delete": {
            "Oakleigh": 2,
            "West Hoe Heights": 1,
          },
          "update": {
            "Oakleigh": 1,
          },
        },
        "version": "246",
      }
    `);
  });

  it('returns undefined if the version has already been processed', async () => {
    expect(await processChangelog('246')).toBeUndefined();
  });
});
