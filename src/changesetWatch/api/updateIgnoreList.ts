import fetch from 'node-fetch';
import { spreadsheetId } from '../../common';
import { googleAuth } from './googleAuth';

export type IgnoredAddr = {
  addrId: string;
  streetAddress: string;
  suburb: string;
  user: string;
  date: Date;
  isDataError: boolean;
  comment: string;
};

export async function updateIgnoreList(toAdd: IgnoredAddr[]): Promise<void> {
  if (!toAdd.length) {
    console.log('Nothing to add to the spreadsheet');
    return;
  }

  const range = 'addr_DoNotAdd!A3:G3';

  const accessToken = await googleAuth();

  console.log('Updating spreadsheet...');
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        // ['LINZ Topo50 ID', 'Layer', 'Sector', 'User', 'Date/Time (UTC)', 'Is Data Error?', 'Comment'],
        values: toAdd.map((a) => [
          a.addrId,
          a.streetAddress,
          a.suburb,
          a.user,
          a.date.toISOString(),
          `${a.isDataError}`.toUpperCase(),
          a.comment,
        ]),
      }),
    },
  ).then((r) => r.json());
}
