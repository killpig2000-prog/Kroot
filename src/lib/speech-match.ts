// Compares what the speech recogniser heard against the model Korean answer.
// Punctuation, spacing and case are all noise here — only the syllables matter.
export function normalizeKr(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?~"'“”‘’·…\-—()[\]{}:;]/g, "")
    .replace(/\s+/g, "");
}

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const JUNG = ["ㅏ", "ㅐ", "ㅑ", "ㅒ", "ㅓ", "ㅔ", "ㅕ", "ㅖ", "ㅗ", "ㅘ", "ㅙ", "ㅚ", "ㅛ", "ㅜ", "ㅝ", "ㅞ", "ㅟ", "ㅠ", "ㅡ", "ㅢ", "ㅣ"];
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];

// Decompose Hangul syllable blocks into their component jamo (초성/중성/종성)
// so similarity is scored at the sound level instead of the whole-syllable
// level. Speech recognition on short words tends to mishear one jamo (e.g.
// "물" heard as "불") — at the syllable level that's already a full
// character wrong, which craters the score of a 1-2 syllable word. At the
// jamo level it's a single substitution among many, which scores fairly.
export function decomposeToJamo(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / 588);
      const jung = Math.floor((offset % 588) / 28);
      const jong = offset % 28;
      out += CHO[cho] + JUNG[jung] + JONG[jong];
    } else {
      out += ch;
    }
  }
  return out;
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
  const x = decomposeToJamo(normalizeKr(a));
  const y = decomposeToJamo(normalizeKr(b));
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
