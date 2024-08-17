/** cache the access_token while this script is running */
let cache: string;

export async function googleAuth(): Promise<string> {
  if (cache) return cache;

  const { GOOGLE_REFRESH_TOKEN, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } =
    process.env;

  if (!GOOGLE_REFRESH_TOKEN || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error('Missing google OAuth environment variables');
  }

  console.log('Authenticating with google...');
  const { access_token } = await fetch(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      method: 'POST',
      body: JSON.stringify({
        refresh_token: GOOGLE_REFRESH_TOKEN,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    },
  ).then((r) => r.json() as Promise<{ access_token: string }>);

  cache = access_token;

  return access_token;
}
