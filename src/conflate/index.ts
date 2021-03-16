import { promises as fs } from 'fs';
import { join } from 'path';
import { OSMData, LinzData, Status, DeletionData } from '../types';
import { processWithRef } from './processWithRef';
import { processWithoutRef } from './processWithoutRef';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses';
import { processDuplicates } from './processDuplicates';
import { processDeletions } from './processDeletions';

async function main() {
  console.log('Reading LINZ data into memory...');
  const linzData: LinzData = JSON.parse(
    await fs.readFile(join(__dirname, '../../data/linz.json'), 'utf-8'),
  );
  const { length } = Object.keys(linzData);

  console.log('Reading OSM data into memory...');
  const osmData: OSMData = JSON.parse(
    await fs.readFile(join(__dirname, '../../data/osm.json'), 'utf-8'),
  );

  console.log('Reading deletion data into memory...');
  const deletionData: DeletionData = JSON.parse(
    await fs.readFile(
      join(__dirname, '../../data/linz-deletions.json'),
      'utf-8',
    ),
  );

  const statusReport: Record<
    Status,
    [linzId: string, diagnostics: unknown][]
  > = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
  };

  console.log('processing deleted data...');
  console.time('conflateDeletions');

  const [extraStatusReportSections, doNotCreate] = processDeletions(
    deletionData,
    osmData,
    linzData,
  );
  // this mutates statusReport
  Object.assign(statusReport, extraStatusReportSections);
  console.timeEnd('conflateDeletions');

  console.log('Processing data...');
  let i = 0;
  console.time('conflate');

  // TODO: perf baseline: 300seconds
  for (const linzId in linzData) {
    // skip this one if it's a LINZ_REF_CHANGED
    if (doNotCreate.includes(linzId)) continue; // eslint-disable-line no-continue

    const osmAddr = osmData.linz[linzId];
    const linzAddr = linzData[linzId];
    const duplicate = osmData.duplicateLinzIds[linzId];
    const semi = osmData.semi[linzId];

    if (osmAddr) {
      const { status, diagnostics } = processWithRef(linzId, linzAddr, osmAddr);
      statusReport[status].push([linzId, diagnostics]);
    } else if (duplicate) {
      const { status, diagnostics } = processDuplicates(
        linzId,
        linzAddr,
        duplicate,
      );
      statusReport[status].push([linzId, diagnostics]);
    } else if (semi) {
      statusReport[Status.CORRUPT].push([linzId, semi]);
    } else {
      const possibleAddresses = findPotentialOsmAddresses(
        linzAddr,
        osmData.noRef,
      );
      const { status, diagnostics } = processWithoutRef(
        linzId,
        linzAddr,
        possibleAddresses,
      );
      statusReport[status].push([linzId, diagnostics]);
    }

    i += 1;
    if (!(i % 1000)) {
      process.stdout.write(`${((i / length) * 100).toFixed(1)}% `);
    }
  }

  console.timeEnd('conflate');

  await fs.writeFile(
    join(__dirname, '../../data/status.json'),
    JSON.stringify(statusReport),
  );
}

main();
