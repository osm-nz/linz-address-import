import { LINZ_LAYER, RURAL_URBAN_LAYER } from '../common/const';
import { linzApi, statsNzApi } from './util';

async function main() {
  const linzResponse = await linzApi.generateExport(LINZ_LAYER);
  console.log(`Requested Address dataset export #${linzResponse.id}`);

  const statsNzResponse = await statsNzApi.generateExport(RURAL_URBAN_LAYER);
  console.log(`Requested rural-urban boundary export #${statsNzResponse.id}`);
}
main();
