import { promises as fs } from 'fs';
import { join } from 'path';
import { OSMData, LinzData, Status, OsmAddr } from '../types';
import { processWithRef } from './processWithRef';
import { processWithoutRef } from './processWithoutRef';
import { findPotentialOsmAddresses } from './findPotentialOsmAddresses';
import { processDuplicates } from './processDuplicates';

async function main() {
  console.log('Reading LINZ data into memory...');
  const linzData: LinzData = JSON.parse(
    await fs.readFile(join(__dirname, '../../data/linz.json'), 'utf-8'),
  );

  console.log('Reading OSM data into memory...');
  const osmData: OSMData = JSON.parse(
    await fs.readFile(join(__dirname, '../../data/osm.json'), 'utf-8'),
  );

  console.log('Reading deletion data into memory...');
  const deletionData: [linzId: string, suburb: string][] = JSON.parse(
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
  };

  console.log('Processing data...');
  let i = 0;
  console.time('conflate');

  // TODO: perf baseline: 300seconds
  for (const linzId in linzData) {
    const osmAddr = osmData.linz[linzId];
    const linzAddr = linzData[linzId];
    const duplicate = osmData.duplicateLinzIds[linzId];

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
    if (!(i % 1000)) process.stdout.write('.');
  }

  statusReport[Status.NEEDS_DELETE] = deletionData
    .filter(([linzId]) => osmData.linz[linzId]?.osmId[0] === 'n')
    .map(
      ([linzId, suburb]) =>
        [linzId, [suburb, osmData.linz[linzId]]] as [string, [string, OsmAddr]],
    );

  statusReport[Status.NEEDS_DELETE_BUILDING] = deletionData
    .filter(
      ([linzId]) =>
        osmData.linz[linzId] && osmData.linz[linzId].osmId[0] !== 'n',
    )
    .map(
      ([linzId, suburb]) =>
        [linzId, [suburb, osmData.linz[linzId]]] as [string, [string, OsmAddr]],
    );

  console.timeEnd('conflate');

  await fs.writeFile(
    join(__dirname, '../../data/status.json'),
    JSON.stringify(statusReport),
  );
}

main();
