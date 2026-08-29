export type DiffToken = { type: "same" | "del" | "ins"; text: string };

/**
 * Word-level diff between two Korean sentences (split on whitespace) using
 * longest-common-subsequence — good enough to highlight which words changed
 * without pulling in a diff library. Returns tokens for the "before" line
 * (same + del) and tokens for the "after" line (same + ins) via two calls,
 * or use `diffWordsInline` for a single combined stream.
 */
function lcsTable(a: string[], b: string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  return table;
}

/** Combined stream: unchanged words once, then a del/ins pair for changed spans. */
export function diffWordsInline(before: string, after: string): DiffToken[] {
  const a = before.split(/\s+/).filter(Boolean);
  const b = after.split(/\s+/).filter(Boolean);
  const table = lcsTable(a, b);

  const tokens: DiffToken[] = [];
  let delBuf: string[] = [];
  let insBuf: string[] = [];
  const flush = () => {
    if (delBuf.length) tokens.push({ type: "del", text: delBuf.join(" ") });
    if (insBuf.length) tokens.push({ type: "ins", text: insBuf.join(" ") });
    delBuf = [];
    insBuf = [];
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      flush();
      tokens.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      delBuf.push(a[i]);
      i++;
    } else {
      insBuf.push(b[j]);
      j++;
    }
  }
  while (i < a.length) {
    delBuf.push(a[i]);
    i++;
  }
  while (j < b.length) {
    insBuf.push(b[j]);
    j++;
  }
  flush();
  return tokens;
}
