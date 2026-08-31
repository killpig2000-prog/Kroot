// Guards the learner against a "translation" that never happened.
//
// Two machine-translation passes left junk in the content data, and both
// rendered straight to learners in place of the real meaning:
//
//   vocabulary  meaning_ja: "【weather】"   — the English, in brackets
//   listening   ja: "...past flooding 歴史" — the English, one word swapped
//
// English is a fine fallback; a bracketed English word dressed up as Japanese
// is not. Anything that carries no more information than the English source is
// treated as absent, so the caller falls back the way it would for a word that
// was never translated at all.

// Unicode-aware: "Tôi" has to tokenize as one Vietnamese word, not as "T"
// plus "i" — the fragments collide with English "I"/"a" and make a real
// translation look like an untouched English sentence.
const WORD = /[\p{L}][\p{L}'’-]*/gu;
// Kana, CJK ideographs, and the compatibility block.
const CJK = /[぀-ヿ㐀-䶿一-鿿豈-﫿]/;

/** Strips a 【…】 or […] wrapper, which in this data only ever marks a placeholder. */
function unwrap(value: string): string | null {
  const trimmed = value.trim();
  const wrapped =
    (trimmed.startsWith("【") && trimmed.endsWith("】")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
  return wrapped ? trimmed.slice(1, -1).trim() : null;
}

/**
 * True when `translated` is a real translation of `english` — i.e. worth
 * showing. `locale` is the app locale ("ja", "zh-Hans", "vi", "es").
 */
export function isTranslated(
  translated: string | undefined | null,
  english: string,
  locale: string
): translated is string {
  if (!translated) return false;
  const value = translated.trim();
  if (!value) return false;

  // A bracket wrapper is a placeholder, whatever is inside it.
  if (unwrap(value) !== null) return false;

  const source = english.trim();
  if (value.toLowerCase() === source.toLowerCase()) return false;

  // "English with a word swapped in", measured from both ends. Real
  // Vietnamese shares a script with English but almost no words, so both
  // rules are safe for vi as well as ja/zh.
  const words = value.match(WORD) ?? [];
  const sourceWords = (source.match(WORD) ?? []).map((w) => w.toLowerCase());
  const sourceSet = new Set(sourceWords);
  // One-letter matches are noise ("a", "I"), not evidence of a shared sentence.
  const survived = words.filter((w) => w.length > 1 && sourceSet.has(w.toLowerCase()));

  // Most of what the translation says is words it inherited from the source.
  if (words.length >= 2 && survived.length >= 2 && survived.length / words.length >= 0.6) {
    return false;
  }
  // Or: most of the source is still standing inside the "translation". A real
  // one keeps at most a proper noun or two.
  const sourceLong = new Set(sourceWords.filter((w) => w.length > 1));
  if (sourceLong.size >= 3) {
    const kept = new Set(survived.map((w) => w.toLowerCase())).size;
    if (kept / sourceLong.size >= 0.35) return false;
  }

  if (locale === "ja" || locale === "zh-Hans" || locale === "zh") {
    // Japanese and Chinese without a single CJK character never got translated.
    if (!CJK.test(value)) return false;
    // A few CJK words dropped into an English sentence ("past flooding 歴史")
    // is the same non-translation wearing a hat. Real ja/zh text is mostly
    // not Latin, even when it carries a borrowed name.
    const letters = (value.match(/[A-Za-z]/g) ?? []).length;
    const dense = value.replace(/\s/g, "").length;
    if (dense > 0 && letters / dense > 0.5) return false;
  }

  return true;
}
