import { processChangelog } from '../processChangelog';

describe('processChangelog', () => {
  it('returns the correct JSON', async () => {
    expect(await processChangelog('245')).toMatchInlineSnapshot(`
      Object {
        "date": "2021-03-12T13:37:56.287567Z",
        "json": Object {
          "add": Object {
            "Oakleigh": 1,
          },
          "delete": Object {
            "Oakleigh": 2,
            "West Hoe Heights": 1,
          },
          "update": Object {
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
