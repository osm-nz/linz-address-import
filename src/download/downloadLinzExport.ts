import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { Readable } from 'node:stream';
import { createGunzip } from 'node:zlib';
import { finished, pipeline } from 'node:stream/promises';
import { linzCsvFile, linzZipFile } from '../preprocess/const.js';
import {
  download,
  getAuthToken,
  getJob,
  listLayers,
} from './sdk/OpenAddresses.js';

async function main() {
  console.log('Getting auth token…');
  const username = process.env.OPEN_ADDRESSES_USERNAME;
  const password = process.env.OPEN_ADDRESSES_PASSWORD;
  if (!username || !password) {
    throw new ReferenceError('Missing OpenAddresses credential');
  }
  const token = await getAuthToken(username, password);

  console.log('Getting layers…');
  const allLayers = await listLayers();
  const layer = allLayers.find(
    (l) => l.source === 'nz/countrywide' && l.layer === 'addresses',
  );
  if (!layer) throw new ReferenceError('layer not found');

  console.log(`Getting job #${layer.job}…`);
  const job = await getJob(layer.job);
  console.log('job', job);
  console.log('timestamps', {
    job: new Date(job.created).toLocaleString('sv'),
    now: new Date().toLocaleString('sv'),
  });

  console.log(`Downloading ${Math.ceil(layer.size / 1e3 / 1e3)}MB…`);
  await fs.rm(linzZipFile, { force: true });
  const response = await download(layer.job, token);

  const fileStream = createWriteStream(linzZipFile, { flags: 'wx' });
  await finished(Readable.fromWeb(response.body!).pipe(fileStream));

  console.log('Unzipping…');
  const source = createReadStream(linzZipFile);
  const destination = createWriteStream(linzCsvFile);
  await pipeline(source, createGunzip(), destination);

  console.log('Done!');
}

main();
