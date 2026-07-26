export interface CharEntry {
  id: number;
  ch: string;
  newInBatch: number;
}

export function computeCharIds(
  newVal: string,
  oldVal: string,
  oldIds: readonly number[],
  nextId: { current: number },
): number[] {
  const n = newVal.length;
  const o = oldVal.length;

  if (oldIds.length === 0) {
    const res: number[] = new Array(n);
    for (let i = 0; i < n; i++) res[i] = nextId.current++;
    return res;
  }

  let s = 0;
  while (s < n && s < o && newVal[s] === oldVal[s]) s++;

  let ne = n - 1;
  let oe = o - 1;
  while (ne >= s && oe >= s && newVal[ne] === oldVal[oe]) {
    ne--;
    oe--;
  }

  const res: number[] = [];
  for (let i = 0; i < s; i++) res.push(oldIds[i]);
  for (let i = s; i <= ne; i++) res.push(nextId.current++);
  for (let i = ne + 1; i < n; i++) res.push(oldIds[o - (n - i)]);
  return res;
}

export function getCurrentWord(
  value: string,
  pos: number,
): { word: string; start: number; end: number } | null {
  if (!value || pos > value.length) return null;
  const isWordChar = (ch: string) => /[\p{L}\p{N}]/u.test(ch);
  let start = pos;
  while (start > 0 && isWordChar(value[start - 1])) start--;
  let end = pos;
  while (end < value.length && isWordChar(value[end])) end++;
  const word = value.slice(start, end);
  return word.length >= 2 ? { word, start, end } : null;
}
