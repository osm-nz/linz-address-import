import { join, relative, extname } from 'node:path';
import { promises as fs } from 'node:fs';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config as dotenv } from 'dotenv';
import { lookup } from 'mime-types';
import fetch from 'node-fetch';
import { CDN_URL } from '../action/util';
import { uploadStatsToGH } from './uploadStatsToGH';

dotenv();

// const KEEP_REGEX = /(linz.csv)/i; // don't delete linz.csv

async function getFilesDeep(folder: string): Promise<string[]> {
  const out = [];
  const files = await fs.readdir(folder);
  for (const file of files) {
    const filePath = join(folder, file);

    if (await fs.stat(filePath).then((f) => f.isDirectory())) {
      out.push(...(await getFilesDeep(filePath)));
    } else {
      out.push(filePath);
    }
  }
  return out;
}

const root = join(__dirname, '../..');

async function upload(
  azContainer: ContainerClient,
  folder: string,
  prefix?: string,
) {
  console.log('Parsing files to upload...');

  const base = join(root, folder);
  const files = await getFilesDeep(base);

  console.log(`\nUploading ${files.length} files from ${folder}...`);
  for (const [index, file] of files.entries()) {
    const relativePath = join(
      prefix || '',
      relative(base, file).replaceAll('\\', '/'),
    );
    const fileClient = azContainer.getBlockBlobClient(relativePath);
    await fileClient.uploadFile(file);
    await fileClient.setHTTPHeaders({
      blobContentType: lookup(extname(file)) || 'text/plain',
    });
    if (!(index % 10)) process.stdout.write('.');
  }
}

async function main() {
  const { AZ_CON } = process.env;

  if (!AZ_CON) {
    throw new Error(
      'You need to create a file called ".env" in the root of the reposity, and add the AZ_CON="..." variable',
    );
  }

  console.log('Updating stats on GitHub...');
  await uploadStatsToGH();

  const az = BlobServiceClient.fromConnectionString(AZ_CON);
  const azC = az.getContainerClient('$web');

  // console.log('Deleting existing files...');
  // let j = 0;
  // for await (const file of azC.listBlobsFlat()) {
  //   if (!file.name.match(KEEP_REGEX)) {
  //     await azC.getBlockBlobClient(file.name).delete();
  //     j += 1;
  //     if (!(j % 10)) process.stdout.write('.');
  //   }
  // }

  console.log('Preparing upload...');
  await upload(azC, './out');

  console.log('Reseting locked datasets...');
  await fetch(`${CDN_URL}/__postsync`);

  console.log('\nUpload complete!');
}

main().catch((ex) => {
  console.error(ex);
  process.exit(1);
});

// BlobServiceClient.fromConnectionString(process.env.AZ_CON!)
//   .getContainerClient('$web')
//   .getBlockBlobClient('index.json')
//   .uploadFile(join(root, './out/index.json'));
