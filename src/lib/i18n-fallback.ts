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

const LATIN_WORD = /[A-Za-z][A-Za-z'’-]*/g;
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

  // "English with a word swapped in": most of the Latin words survived from
  // the source sentence. Real Vietnamese shares almost no bare-ASCII words
  // with its English source, so this is safe for vi as well as ja/zh — and
  // the three-word floor keeps short, legitimately Latin answers ("OK") in.
  const words = value.match(LATIN_WORD) ?? [];
  if (words.length >= 3) {
    const sourceWords = new Set((source.match(LATIN_WORD) ?? []).map((w) => w.toLowerCase()));
    const survived = words.filter((w) => sourceWords.has(w.toLowerCase())).length;
    if (survived >= 3 && survived / words.length >= 0.6) return false;
  }

  // Japanese and Chinese without a single CJK character never got translated.
  if ((locale === "ja" || locale === "zh-Hans" || locale === "zh") && !CJK.test(value)) {
    return false;
  }

  return true;
}
