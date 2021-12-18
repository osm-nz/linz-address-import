import fetch from 'node-fetch';
import { updateLastCheckDate } from '../updateLastCheckDate';

jest.mock('node-fetch');
jest.mock('../googleAuth', () => ({
  googleAuth: async () => 'MY_ACCESS_TOKEN',
}));

describe('updateLastCheckDate', () => {
  it('calls the google API correctly', async () => {
    (fetch as unknown as jest.Mock).mockResolvedValue({ json: async () => 0 });

    jest.useFakeTimers().setSystemTime(new Date('2021-12-25').getTime());

    await updateLastCheckDate('2021-12-24');
    expect(fetch).toHaveBeenCalledWith(
      'https://sheets.googleapis.com/v4/spreadsheets/1BNrUQof78t-OZlCHF3n_MKnYDARFoCRZB7xKxQPmKds/values/Metadata!A4:C4?valueInputOption=USER_ENTERED',
      {
        method: 'PUT',
        body: JSON.stringify({
          range: 'Metadata!A4:C4',
          majorDimension: 'ROWS',
          values: [['2021-12-25T00:00:00.000Z', '2021-12-24', 'C']],
        }),
        headers: { Authorization: 'Bearer MY_ACCESS_TOKEN' },
      },
    );
  });
});
