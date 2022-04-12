import { promises as fs } from 'fs';
import { fetchIgnoreList } from '../common';
import { ignoreFile } from './const';

export async function main(): Promise<void> {
  const res = await fetchIgnoreList(0, 'LINZ Address ID');
  await fs.writeFile(ignoreFile, JSON.stringify(res));
}

if (process.env.NODE_ENV !== 'test') main();
