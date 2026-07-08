import { join } from 'node:path';
import type { Config } from '@osm-conflation-engine/cli';
import taginfo from '../taginfo.json';
import { linzFile, planetFile } from './preprocess/const.js';
import { outFolder } from './conflate/helpers/const.js';

export const REF_TAG = 'ref:linz:address_id';

export const ADDR_KEY_REGEX = /^(alt_)?addr\d*:/;

export const config: Config = {
  $schema: 'https://github.com/a',
  metadata: {
    region: 'NZ',
    name: taginfo.project.name,
    description: taginfo.project.description,
    wiki_page: taginfo.project.doc_url,
    git_repository: taginfo.project.project_url,
  },
  source_data: {
    type: 'file',
    file: linzFile,
  },
  o_data: {
    source: {
      type: 'pbf',
      pbf_url: planetFile,
      pbf_filter: ['addr:housenumber+addr:street,ref:linz:address_id'],
    },
    tags_to_keep: [
      'check_date',
      REF_TAG,
      ADDR_KEY_REGEX.toString(),
      'building:flats',
      'name',
      'craft',
      'tourism',
      'shop',
      'linz:stack',
    ],
  },
  merge: {
    dataset_column: 'id',
    osm_key: REF_TAG,
  },
  output: {
    folder: outFolder,
  },
  e2e_tests: {
    ignore_list_file_path: join(
      import.meta.dirname,
      './__tests__/mock/ignore-list.csv',
    ),
  },
};
