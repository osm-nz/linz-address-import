import fetch from 'node-fetch';
import { spreadsheetId } from '../../common/index.js';
import { googleAuth } from './googleAuth.js';

export async function updateLastCheckDate(
  previousLastCheck: string,
): Promise<void> {
  const newLastCheck = new Date().toISOString();

  const range = 'Metadata!A4:C4';

  const accessToken = await googleAuth();

  console.log('Updating last checked metadata...');
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [[newLastCheck, previousLastCheck, 'C']],
      }),
    },
  ).then((r) => r.json());
}
