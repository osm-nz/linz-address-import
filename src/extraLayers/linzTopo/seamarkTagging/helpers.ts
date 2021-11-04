// a small number of chart names don't use NZGB compliant names
export const fixChartName = (str: string): string =>
  str
    .replace('Totaranui', 'Tōtaranui')
    .replace('Tamaki', 'Tāmaki')
    .replace('Whangarei', 'Whangārei')
    .replace('Kaikoura', 'Kaikōura')
    .replace('Niue', 'Niuē')
    .replace('Samoa', 'Sāmoa')
    .replace('Ohiwa', 'Ōhiwa')
    .replace('Whakatane', 'Whakatāne')
    .replace('Wanganui', 'Whanganui')
    .replace(/Taupo/g, 'Taupō')
    .replace('Tutukaka', 'Tutukākā');

/** source tags for maritime data look like `NZ,NZ,Chart123` */
export const cleanSource = (
  source: string | undefined,
  chartName: string | undefined,
): string => {
  const out = ['LINZ'];
  if (chartName) {
    const chunks = chartName.split(' - ');
    let chart = chunks.slice(-1)[0];
    if (chart === 'West' || chart === 'East') {
      const [c1, c2] = chunks.slice(-2);
      chart = `${c1} (${c2})`;
    }
    out.push(`${chart} Chart`);
  }

  const arr = source
    ?.split(',')
    .filter(
      (x) => x !== 'NZ' && x !== 'graph' && x !== 'reprt' && x !== 'publn',
    );
  if (arr) out.push(...new Set(arr));

  return out.filter((x) => x).join(';');
};

/** dates use the `YYYYMMDD` or `YYYYMM` or `YYYY` format */
export const cleanDate = (date: string | undefined): string | undefined => {
  if (!date) return undefined;
  return [date.slice(0, 4), date.slice(4, 6), date.slice(6, 8)]
    .filter((x) => x)
    .join('-');
};

// see unit tests
export const cleanSequence = (input: string): string =>
  input.replace(/(^|\(|\+)0+(\d)/g, (_, ch, d) => ch + d).replace(/\.0/g, '');
