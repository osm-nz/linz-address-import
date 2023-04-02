import { GeoJsonFeature } from '../../types';

export function calcCount(features: GeoJsonFeature[]): {
  count: string;
  totalCount: number;
} {
  let plus = 0;
  let minus = 0;
  let move = 0;
  let edit = 0;

  for (const f of features) {
    switch (f.properties.__action) {
      case 'delete':
        minus += 1;
        break;
      case 'move':
        move += 1;
        break;
      case 'edit':
        edit += 1;
        break;
      default:
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
