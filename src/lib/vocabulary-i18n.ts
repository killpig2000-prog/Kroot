import type { RawVocabWord } from "@/lib/vocabulary-data/types";

// Structural subsets so callers that carry only the English fields (e.g.
// WordDetailCard's DetailWord) type-check; they simply fall back to English.
type MeaningFields = Pick<RawVocabWord, "meaning_en"> &
  Partial<Pick<RawVocabWord, "meaning_ja" | "meaning_zh" | "meaning_vi" | "meaning_es">>;
type ExampleFields = Pick<RawVocabWord, "example_en"> &
  Partial<Pick<RawVocabWord, "example_ja_en" | "example_zh_en" | "example_vi_en" | "example_es">>;

export function getLocalizedMeaning(word: MeaningFields, locale: string): string {
  const meanings: Record<string, string | undefined> = {
    ja: word.meaning_ja,
    "zh-Hans": word.meaning_zh,
    vi: word.meaning_vi,
    es: word.meaning_es,
  };
  return meanings[locale] || word.meaning_en;
}

export function getLocalizedExampleEn(word: ExampleFields, locale: string): string {
  const examples: Record<string, string | undefined> = {
    ja: word.example_ja_en,
    "zh-Hans": word.example_zh_en,
    vi: word.example_vi_en,
    es: word.example_es,
  };
  return examples[locale] || word.example_en;
}
