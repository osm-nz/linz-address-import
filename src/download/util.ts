import { config as dotenv } from 'dotenv';
import { Koordinates } from 'koordinates-api';

dotenv();

export const linzApi = new Koordinates({
  host: 'https://data.linz.govt.nz',
  apiKey: process.env.LINZ_API_KEY!,
});

export const statsNzApi = new Koordinates({
  host: 'https://datafinder.stats.govt.nz',
  apiKey: process.env.STATS_NZ_API_KEY!,
});
