export const hash = (str: string): string => {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);

    h = (h << 5) - h + char;
    h &= h; // convert to 32bit integer
  }
  return new Uint32Array([h])[0].toString(36);
};

export function toStackId(ids: string[]): string {
  const stack = ids
    .sort((a, b) => +a - +b) // sort may not even be required
    .reduce<string[]>((newArr, id, i, oldArr) => {
      newArr.push(
        !i || +oldArr[i - 1] - +id + 1
          ? id
          : `${newArr.pop()!.split('-')[0]}-${id}`,
      );
      return newArr;
    }, [])
    .join(',');

  if (stack.length < 248) return `stack(${stack})`;

  // if it's too big, it won't fit in a OSM field which has maxlength=255
  // so we replace it with a hash, which is much less useful but sadly the only option
  return `stack[${hash(stack)}]`;
}

export const INVALID_STACK = Symbol('INVALID_STACK');
export const HASHED_STACK = Symbol('HASHED_STACK');

export function fromStackId(
  stackStr: string,
): string[] | typeof INVALID_STACK | typeof HASHED_STACK {
  if (stackStr.startsWith('stack[')) return HASHED_STACK;

  if (!stackStr.endsWith(')') || !stackStr.startsWith('stack(')) {
    return INVALID_STACK;
  }

  return stackStr
    .slice(0, -1) // remove `)`
    .slice(6) // remove `stack(`
    .split(',')
    .flatMap((x) => {
      if (!x.includes('-')) return [x];

      const [from, to] = x.split('-').map(Number);
      return new Array(to - from + 1).fill(0).map((_, i) => `${from + i}`);
    });
}
