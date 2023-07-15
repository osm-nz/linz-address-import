import { promises as fs } from 'node:fs';
import { fetchIgnoreList } from '../common';
import { ignoreFile } from './const';

export async function main(): Promise<void> {
  const result = await fetchIgnoreList(0, 'LINZ Address ID');
  await fs.writeFile(ignoreFile, JSON.stringify(result));
}

if (process.env.NODE_ENV !== 'test') main();
