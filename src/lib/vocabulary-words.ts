// The actual word data, split out from `lib/vocabulary` so that module can
// stay pure logic.
//
// `example-overrides.json` is ~950 KB on disk and near 1.7 MB once emitted as
// a `JSON.parse` chunk. A JSON module has a single opaque default export, so
// nothing can tree-shake it: any client component reaching `lib/vocabulary`
// for even a three-line helper used to drag the whole file into that route's
// bundle. Keeping the data here means importing a helper costs nothing.
//
// Import this from server components, or lazily (see `lib/word-bank`) — never
// at the top level of a client component.
import type { CefrLevel } from "@/lib/tree";
import type { RawVocabWord } from "@/lib/vocabulary-data/types";
import { DAILY_LIFE_WORDS } from "@/lib/vocabulary-data/daily-life";
import EXAMPLE_OVERRIDES from "@/lib/vocabulary-data/example-overrides.json";
import { CHAPTER_SIZE, type VocabWord } from "@/lib/vocabulary";

// Regenerated example sentences (see scripts/gen-vocab-examples.mts) whose
// grammar actually matches the word's CEFR level, keyed by "{level}:{korean}".
// Falls back to the hand-authored example_kr/example_en until a word's been
// regenerated — never a missing example.
function withExampleOverride(w: RawVocabWord): RawVocabWord {
  const override = (EXAMPLE_OVERRIDES as Record<string, { example_kr: string; example_en: string }>)[
    `${w.level}:${w.korean}`
  ];
  return override ? { ...w, example_kr: override.example_kr, example_en: override.example_en } : w;
}

const TOPIC_WORD_SOURCES: Record<string, RawVocabWord[]> = {
  "daily-life": DAILY_LIFE_WORDS,
};

export function getWordsForTopic(topicKey: string, level?: CefrLevel): VocabWord[] {
  const raw = TOPIC_WORD_SOURCES[topicKey] ?? [];
  return raw
    .filter((w) => !level || w.level === level)
    .map((w) => ({ ...withExampleOverride(w), topic_key: topicKey, key: `${topicKey}:${w.level}:${w.korean}` }));
}

// Splits a level's word list into fixed, deterministically-ordered chapters —
// short enough to clear in a couple of minutes, so leveling up feels frequent.
export function getChaptersForTopic(topicKey: string, level: CefrLevel): VocabWord[][] {
  const words = getWordsForTopic(topicKey, level);
  const chapters: VocabWord[][] = [];
  for (let i = 0; i < words.length; i += CHAPTER_SIZE) {
    chapters.push(words.slice(i, i + CHAPTER_SIZE));
  }
  return chapters;
}
