import { promises as fs } from 'node:fs';
import path from 'node:path';
import Unzip from 'adm-zip';
import type { Koordinates } from 'koordinates-api';
import { aimCsvFile, linzCsvFile } from '../preprocess/const.js';
import {
  AIM_LAYER_NAME_SUBSTR,
  LINZ_LAYER_NAME_SUBSTR,
} from '../common/const.js';
import { linzApi } from './util.js';

async function downloadExport(
  outputFilePath: string,
  layerNameSubstr: string,
  api: Koordinates,
) {
  console.log('Starting', layerNameSubstr);
  const outputFile = path.parse(outputFilePath);
  await fs.mkdir(outputFile.dir, { recursive: true });

  const allExports = await api.listExports();
  const recentExports = allExports
    .filter(
      (item) =>
        item.created_at &&
        item.state !== 'gone' &&
        item.state !== 'cancelled' &&
        item.name.includes(layerNameSubstr),
    )
    .sort((a, b) => +new Date(b.created_at!) - +new Date(a.created_at!));

  const mostRecent = recentExports[0];
  if (!mostRecent) {
    throw new Error('No recent exports found.');
  }

  console.log(
    `\tMost recent export is #${mostRecent.id}, created at ${mostRecent.created_at}`,
  );

  if (!mostRecent.download_url) {
    throw new Error('Export has no download_url yet');
  }

  console.log(`\tDownloading from ${mostRecent.download_url} …`);

  const tempFilePath = await api.downloadExport(mostRecent.download_url);
  console.log(`\tSaved to ${tempFilePath}`);

  const zip = new Unzip(tempFilePath);
  const zipEntries = zip.getEntries();

  const csvFile = zipEntries.find((file) => file.entryName.endsWith('.csv'));

  if (!csvFile) {
    throw new Error('No csv file in zip');
  }

  console.log(`\tExtracting ${csvFile.entryName}…`);

  zip.extractEntryTo(
    csvFile.entryName,
    outputFile.dir,
    /* maintainEntryPath */ false,
    /* overwrite */ true,
    /* keepOriginalPermission */ undefined,
    outputFile.base,
  );

  console.log('\tDeleting temp file…');
  await fs.rm(tempFilePath, { force: true });

  console.log('\tDone!');
}

async function main() {
  await downloadExport(linzCsvFile, LINZ_LAYER_NAME_SUBSTR, linzApi);
  await downloadExport(aimCsvFile, AIM_LAYER_NAME_SUBSTR, linzApi);
}
main();
