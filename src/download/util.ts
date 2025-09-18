import { config as dotenv } from 'dotenv';
import { Koordinates } from 'koordinates-api';

dotenv();

export const linzApi = new Koordinates({
  host: 'https://data.linz.govt.nz',
  apiKey: process.env.LINZ_API_KEY!,
});
