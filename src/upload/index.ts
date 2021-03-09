import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import { config as dotenv } from 'dotenv';
import { join, relative, extname } from 'path';
import { promises as fs } from 'fs';
import { lookup } from 'mime-types';

dotenv();

const KEEP_REGEX = /(rapid)/i; // don't delete anything in /rapid

async function getFilesDeep(folder: string): Promise<string[]> {
  const out = [];
  const files = await fs.readdir(folder);
  for (const file of files) {
    const filePath = join(folder, file);

    if ((await fs.stat(filePath)).isDirectory()) {
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
  const base = join(root, folder);
  const files = await getFilesDeep(base);

  console.log(`\nUploading ${files.length} files from ${folder}...`);
  for (const [i, file] of files.entries()) {
    const relPath = join(
      prefix || '',
      relative(base, file).replace(/\\/g, '/'),
    );
    await azContainer.getBlockBlobClient(relPath).uploadFile(file);
    await azContainer.getBlockBlobClient(relPath).setHTTPHeaders({
      blobContentType: lookup(extname(file)) || 'text/plain',
    });
    if (!(i % 10)) process.stdout.write('.');
  }
}

async function main() {
  const { AZ_CON } = process.env;

  if (!AZ_CON) {
    throw new Error(
      'You need to create a file called ".env" in the root of the reposity, and add the AZ_CON="..." variable',
    );
  }

  const az = BlobServiceClient.fromConnectionString(AZ_CON);
  const azC = az.getContainerClient('$web');

  console.log('Deleting existing files...');
  let j = 0;
  for await (const file of azC.listBlobsFlat()) {
    if (!file.name.match(KEEP_REGEX)) {
      await azC.getBlockBlobClient(file.name).delete();
      j += 1;
      if (!(j % 10)) process.stdout.write('.');
    }
  }

  console.log('Preparing upload...');
  await upload(azC, './out');
  await upload(azC, './static');

  // for developing locally
  if (await fs.stat(join(root, '../RapiD/dist')).catch(() => false)) {
    await upload(azC, '../RapiD/dist', 'rapid');
  }

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
