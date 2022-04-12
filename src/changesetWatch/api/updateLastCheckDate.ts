import fetch from 'node-fetch';
import { spreadsheetId } from '../../common';
import { googleAuth } from './googleAuth';

export async function updateLastCheckDate(
  prevLastCheck: string,
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
        values: [[newLastCheck, prevLastCheck, 'C']],
      }),
    },
  ).then((r) => r.json());
}
