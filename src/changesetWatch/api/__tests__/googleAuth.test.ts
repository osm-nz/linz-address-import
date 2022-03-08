import fetch from 'node-fetch';
import { googleAuth } from '../googleAuth';

jest.mock('node-fetch');

describe('updateIgnoreList', () => {
  beforeEach(() => {
    process.env.GOOGLE_REFRESH_TOKEN = 'RRR';
    process.env.GOOGLE_CLIENT_ID = 'III';
    process.env.GOOGLE_CLIENT_SECRET = 'SSS';
    m(fetch).mockResolvedValue({
      json: async () => ({ access_token: 'ABC123' }),
    });
  });

  it('only calls the google API once', async () => {
    expect(await googleAuth()).toBe('ABC123');
    expect(await googleAuth()).toBe('ABC123');

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://www.googleapis.com/oauth2/v4/token',
      {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: 'RRR',
          client_id: 'III',
          client_secret: 'SSS',
          grant_type: 'refresh_token',
        }),
      },
    );
  });
});
