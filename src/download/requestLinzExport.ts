import { AIM_LAYER, LINZ_LAYER, RURAL_URBAN_LAYER } from '../common/const.js';
import { linzApi, statsNzApi } from './util.js';

async function main() {
  const linzResponse = await linzApi.generateExport(LINZ_LAYER);
  console.log(`Requested Address dataset export #${linzResponse.id}`);

  const aimResponse = await linzApi.generateExport(AIM_LAYER);
  console.log(`Requested AIM dataset export #${aimResponse.id}`);

  const statsNzResponse = await statsNzApi.generateExport(RURAL_URBAN_LAYER);
  console.log(`Requested rural-urban boundary export #${statsNzResponse.id}`);
}
main();
