import { GeoJsonFeature } from '../../types';

export function calcCount(
  features: GeoJsonFeature[],
): { count: string; totalCount: number } {
  let plus = 0;
  let minus = 0;
  let move = 0;
  let edit = 0;

  for (const f of features) {
    if (f.properties.ref_linz_address?.startsWith('SPECIAL_DELETE_')) {
      minus += 1;
    } else if (
      f.properties.ref_linz_address?.startsWith('LOCATION_WRONG_SPECIAL_')
    ) {
      move += 1;
    } else if (f.id.startsWith('SPECIAL_EDIT_')) {
      edit += 1;
    } else {
      plus += 1;
    }
  }

  const strs = [
    plus && `add ${plus}`,
    minus && `delete ${minus}`,
    move && `move ${move}`,
    edit && `edit ${edit}`,
  ].filter((x: string | 0): x is string => !!x);

  return {
    count: strs.join(', '),
    totalCount: plus + minus + move + edit,
  };
}
