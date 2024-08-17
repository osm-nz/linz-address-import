import { updateIgnoreList } from '../updateIgnoreList.js';

vi.mock('../googleAuth', () => ({
  googleAuth: async () => 'MY_ACCESS_TOKEN',
}));

describe('updateIgnoreList', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(<never>{ json: async () => 0 });
  });

  it('does nothing if you pass it an empty array', async () => {
    await updateIgnoreList([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('calls the google API correctly', async () => {
    await updateIgnoreList([
      {
        addrId: '123',
        comment: 'map parking spaces',
        date: new Date('2019-03-03'),
        isDataError: true,
        streetAddress: '30 Madden Street',
        suburb: 'Auckland Central',
        user: 'example',
      },
    ]);
    expect(fetch).toHaveBeenCalledWith(
      'https://sheets.googleapis.com/v4/spreadsheets/1BNrUQof78t-OZlCHF3n_MKnYDARFoCRZB7xKxQPmKds/values/addr_DoNotAdd!A3:G3:append?valueInputOption=USER_ENTERED',
      {
        method: 'POST',
        body: JSON.stringify({
          range: 'addr_DoNotAdd!A3:G3',
          majorDimension: 'ROWS',
          values: [
            [
              '123',
              '30 Madden Street',
              'Auckland Central',
              'example',
              '2019-03-03T00:00:00.000Z',
              'TRUE',
              'map parking spaces',
            ],
          ],
        }),
        headers: { Authorization: 'Bearer MY_ACCESS_TOKEN' },
      },
    );
  });
});
