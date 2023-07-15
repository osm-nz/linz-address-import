import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { ExtraLayers, HandlerReturn, Status, StatusReport } from '../types';
import { outFolder, mock, suburbsFolder, shiftOverlappingPoints } from './util';
import { generateStats } from './generateStats';
import { handlers } from './handlers';
import { createIndex } from './createIndex';
import { sectorize } from './sectorize';

export async function main(): Promise<void> {
  console.log('Reading status file into memory...');
  const status: StatusReport = JSON.parse(
    await fs.readFile(join(__dirname, `../../data/status${mock}.json`), 'utf8'),
  );

  console.log('Clearing output folder...');
  await fs.rm(outFolder, { recursive: true });
  await fs.mkdir(suburbsFolder, { recursive: true });

  console.log('generating stats...');
  await generateStats(status);

  const features: HandlerReturn = {};

  for (const $state in handlers) {
    const state = +$state as Status;
    console.log(`handling status ${Status[state]} ...`);
    // always pass in NEEDS_DELETE data for handlers that need it
    const result = await handlers[state](
      status[state] as never,
      status[Status.NEEDS_DELETE],
    );
    if (result) {
      for (const k in result) {
        features[k] ||= [];
        features[k].push(...result[k]);
      }
    }
  }

  // merge tiny address suburbs into a regional dataset
  for (const k in features) {
    if (features[k].length < 50 && !mock) {
      const parentKey = k.split(' - ')[0];
      features[parentKey] ||= [];
      features[parentKey].push(...features[k]);
      delete features[k];
    }
  }

  const out: ExtraLayers = {};
  for (const k in features) {
    // addresses are always size=medium
    out[k] = { size: 'medium', features: features[k] };
  }

  console.log('reading extra layers...');

  // we do this after generating the 'small places' layer, beacuse we only want to include addresses
  try {
    if (process.env.NODE_ENV !== 'test') {
      const extraLayers: ExtraLayers = JSON.parse(
        await fs.readFile(
          join(__dirname, '../../data/extra-layers.geo.json'),
          'utf8',
        ),
      );
      Object.assign(out, extraLayers);
    }
  } catch {
    console.log('(!) Failed to include extra layers');
  }

  console.log('sectorizing...');
  await createIndex(shiftOverlappingPoints(sectorize(out)));
}

if (process.env.NODE_ENV !== 'test') main();
