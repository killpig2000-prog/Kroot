// Compares what the speech recogniser heard against the model Korean answer.
// Punctuation, spacing and case are all noise here — only the syllables matter.
export function normalizeKr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?~"'“”‘’·…\-—()[\]{}:;]/g, "")
    .replace(/\s+/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = row;
  }
  return prev[b.length];
}

/** 0–1 similarity between two Korean strings after normalization. */
export function similarity(a: string, b: string): number {
  const x = normalizeKr(a);
  const y = normalizeKr(b);
  if (!x && !y) return 1;
  const longest = Math.max(x.length, y.length);
  if (!longest) return 0;
  return 1 - levenshtein(x, y) / longest;
}

/** Best similarity across the model answer and any accepted alternatives. */
export function bestSimilarity(heard: string, answers: string[]): number {
  return answers.reduce((best, a) => Math.max(best, similarity(heard, a)), 0);
}

export type Verdict = "great" | "close" | "again";

export function verdictFor(score: number): Verdict {
  if (score >= 0.8) return "great";
  if (score >= 0.5) return "close";
  return "again";
}
