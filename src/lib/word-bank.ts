import type { VocabWord } from "@/lib/vocabulary";

// Tap-to-save word bank: maps a Korean surface form found in listening /
// reading / grammar / slang text back to a word in the daily-life deck, so
// one tap can plant it into vocabulary_progress (the SRS "Watering" queue).
//
// The 4k-word dictionary is loaded lazily on the first lookup (dynamic
// import), never in the initial bundle of the page that renders the text.

let dictPromise: Promise<Map<string, VocabWord>> | null = null;

function loadDict(): Promise<Map<string, VocabWord>> {
  if (!dictPromise) {
    dictPromise = import("@/lib/vocabulary").then(({ getWordsForTopic }) => {
      const map = new Map<string, VocabWord>();
      for (const w of getWordsForTopic("daily-life")) {
        // Lower levels win when the same surface form appears twice; entries
        // like "안녕/안녕하세요" index each alternative.
        for (const form of w.korean.split("/")) {
          const k = form.trim();
          if (k && !map.has(k)) map.set(k, w);
        }
      }
      return map;
    });
  }
  return dictPromise;
}

const PUNCT_RE = /[.,!?~"'“”‘’·…\-—()[\]{}:;]/g;

// Trailing particles / copula endings, longest first so "에서" wins over "에".
const PARTICLES = [
  "이에요", "입니다", "에서는", "으로는", "에게는", "한테는",
  "에서", "으로", "하고", "에게", "한테", "까지", "부터", "예요", "이나",
  "은", "는", "이", "가", "을", "를", "에", "도", "의", "로", "와", "과", "만", "요", "나",
];

// Verb / adjective endings → strip, then re-attach 다 to get the dictionary form.
// "공부해요" → 공부 + 하다, "먹어요" → 먹 + 다, "가세요" → 가 + 다.
const HADA_ENDINGS = ["했어요", "합니다", "하세요", "해요", "하고", "해서", "하면", "하지", "한"];
const VERB_ENDINGS = [
  "었어요", "았어요", "습니다", "으세요", "세요", "어요", "아요", "ㅂ니다",
  "고", "서", "면", "지", "는", "은", "을", "ㄹ",
];

export function normalizeToken(token: string): string {
  return token.replace(PUNCT_RE, "").trim();
}

function candidates(token: string): string[] {
  const base = normalizeToken(token);
  if (!base) return [];
  const out: string[] = [base];
  const push = (s: string) => {
    if (s && s.length >= 1 && !out.includes(s)) out.push(s);
  };

  for (const p of PARTICLES) {
    if (base.length > p.length && base.endsWith(p)) push(base.slice(0, -p.length));
  }
  for (const e of HADA_ENDINGS) {
    if (base.length > e.length && base.endsWith(e)) push(base.slice(0, -e.length) + "하다");
  }
  for (const e of VERB_ENDINGS) {
    if (base.length > e.length && base.endsWith(e)) push(base.slice(0, -e.length) + "다");
  }
  // A particle stacked on a stripped form: "친구한테는" → 친구한테 → 친구.
  const second = [...out];
  for (const s of second) {
    for (const p of PARTICLES) {
      if (s.length > p.length && s.endsWith(p)) push(s.slice(0, -p.length));
    }
  }
  return out;
}

/** Resolve a tapped token to a deck word, or null when it isn't in the deck. */
export async function lookupWord(token: string): Promise<VocabWord | null> {
  const dict = await loadDict();
  for (const c of candidates(token)) {
    const hit = dict.get(c);
    if (hit) return hit;
  }
  return null;
}

export type KoreanToken = { text: string; isWord: boolean };

const SPLIT_RE = /([\s.,!?~"'“”‘’·…\-—()[\]{}:;]+)/;
const HANGUL_RE = /[가-힣]/;

/** Split a line into word / separator chunks that re-join to the exact original. */
export function tokenizeKorean(text: string): KoreanToken[] {
  return text
    .split(SPLIT_RE)
    .filter((t) => t.length > 0)
    .map((t) => ({ text: t, isWord: HANGUL_RE.test(t) }));
}
