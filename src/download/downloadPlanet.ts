import { setTimeout } from 'node:timers/promises';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { basename, dirname } from 'node:path';
import { config as dotenv } from 'dotenv';
import { planetFile } from '../preprocess/const.js';

dotenv();

const DOWNLOAD_SERVER = 'https://osm-internal.download.geofabrik.de';
const OSM_SERVER = 'https://www.openstreetmap.org';

const getCsrfToken = (html: string) =>
  html.match(/name="csrf-token" content="([^"]+)"/)![1]!;

/**
 * based on these docs: https://github.com/geofabrik/sendfile_osm_oauth_protector/blob/master/doc/client.md
 * This basically scrapes the OSM homepage to login programmatically,
 * bypassing CSRF and bypassing OAuth consent...
 */
async function getAuthToken() {
  if (!process.env.OSM_AUTH) {
    console.warn(
      '(!) No OSM credentials, so the planet extract will not include metadata',
    );
    return {
      url: 'https://download.geofabrik.de/australia-oceania/new-zealand-latest.osm.pbf',
      cookies: '',
    };
  }

  const credentials = new URLSearchParams(process.env.OSM_AUTH);

  // 1. fetch config
  const config = (await fetch(
    `${DOWNLOAD_SERVER}/get_cookie?action=get_authorization_url`,
    { method: 'POST' },
  ).then((r) => r.json())) as {
    authorization_url: string;
    state: string;
    client_id: string;
    redirect_uri: string;
  };

  // 2. fetch home page to get session cookies + CSRF token
  const homePage = await fetch(`${OSM_SERVER}/login?cookie_test=true`);
  let cookieJar = homePage.headers.get('Set-Cookie')!;

  // 3. login
  const loginPage = await fetch(`${OSM_SERVER}/login`, {
    method: 'POST',
    body: new URLSearchParams({
      username: credentials.get('username')!,
      password: credentials.get('password')!,
      referer: '/',
      commit: 'Login',
      authenticity_token: getCsrfToken(await homePage.text()),
    }),
    headers: {
      Cookie: cookieJar,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  if (loginPage.status !== 200) throw new Error('Login failed');
  cookieJar += `; ${loginPage.headers.get('Set-Cookie')!}`;

  // 4. open the OAuth consent page
  const consentPage = await fetch(config.authorization_url, {
    headers: { Cookie: cookieJar },
  });

  // 5. if there is no consent, try to submit the form
  const authToken = consentPage.url.startsWith(OSM_SERVER)
    ? await fetch(config.authorization_url, {
        method: 'POST',
        body: new URLSearchParams({
          client_id: config.client_id,
          redirect_uri: config.redirect_uri,
          authenticity_token: getCsrfToken(await consentPage.text()),
          state: config.state,
          response_type: 'code',
          scope: 'read_prefs',
          nonce: '',
          code_challenge: '',
          code_challenge_method: '',
          commit: 'Authorize',
        }),
        headers: {
          Cookie: cookieJar,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }).then((r) => r.text())
    : await consentPage.text();

  if (!authToken.includes('gf_download_oauth')) throw new Error('No token');

  return {
    url: 'https://osm-internal.download.geofabrik.de/australia-oceania/new-zealand-latest-internal.osm.pbf',
    cookies: authToken,
  };
}

async function main() {
  const { cookies, url } = await getAuthToken();

  await fs.mkdir(dirname(planetFile), { recursive: true });
  await fs.rm(planetFile, { recursive: true, force: true });

  const child = spawn(
    'curl',
    ['-L', url, '-H', `Cookie: ${cookies}`, '--output', basename(planetFile)],
    { cwd: dirname(planetFile) },
  );

  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);

  await new Promise<void>((resolve, reject) => {
    child.on('close', (code) => (code ? reject(code) : resolve()));
  });

  // ensure that the file is written to the disk properly
  await setTimeout(5000);

  console.log(planetFile, await fs.stat(planetFile));
}

main();
