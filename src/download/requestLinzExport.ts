import { LINZ_LAYER } from '../common/const.js';
import { linzApi } from './util.js';

async function main() {
  const linzResponse = await linzApi.generateExport(LINZ_LAYER);
  console.log(`Requested Address dataset export #${linzResponse.id}`);
}
main();
