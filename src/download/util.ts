import { Koordinates } from 'koordinates-api';

export const linzApi = new Koordinates({
  host: 'https://data.linz.govt.nz',
  apiKey: process.env.LINZ_API_KEY!,
});
