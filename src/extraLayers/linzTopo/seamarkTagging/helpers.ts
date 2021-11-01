/** source tags for maritime data look like `NZ,NZ,Chart123` */
export const cleanSource = (
  source: string | undefined,
  chartName: string | undefined,
): string => {
  const out = ['LINZ'];
  if (chartName) {
    out.push(`${chartName.split(' - ').reverse()[0]} Chart`);
  }

  const arr = source
    ?.split(',')
    .filter((x) => x !== 'NZ' && x !== 'graph' && x !== 'reprt');
  if (arr) out.push(...new Set(arr));

  return out.join(';');
};

/** dates use the `YYYYMMDD` or `YYYYMM` or `YYYY` format */
export const cleanDate = (date: string | undefined): string | undefined => {
  if (!date) return undefined;
  return [date.slice(0, 4), date.slice(4, 6), date.slice(6, 8)]
    .filter((x) => x)
    .join('-');
};
