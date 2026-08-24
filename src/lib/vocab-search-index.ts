import { CHAPTER_SIZE, getWordsForTopic } from "@/lib/vocabulary";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

// A flat, searchable snapshot of every word in the daily-life track, mapped
// back to its unit. Loaded lazily (dynamic import) by the search box so the
// 4k-word list never lands in the initial vocabulary-page bundle.
export type SearchEntry = {
  kr: string;
  roman: string;
  en: string;
  level: CefrLevel;
  chapter: number;
};

export const SEARCH_INDEX: SearchEntry[] = LEVEL_ORDER.flatMap((level) =>
  getWordsForTopic("daily-life", level).map((w, i) => ({
    kr: w.korean,
    roman: w.romanization.toLowerCase(),
    en: w.meaning_en.toLowerCase(),
    level,
    chapter: Math.floor(i / CHAPTER_SIZE),
  }))
);
