import type { RawVocabWord } from "@/lib/vocabulary-data/types";
import { isTranslated } from "@/lib/i18n-fallback";

// Structural subsets so callers that carry only the English fields (e.g.
// WordDetailCard's DetailWord) type-check; they simply fall back to English.
type MeaningFields = Pick<RawVocabWord, "meaning_en"> &
  Partial<Pick<RawVocabWord, "meaning_ja" | "meaning_zh" | "meaning_vi" | "meaning_es">>;
type ExampleFields = Pick<RawVocabWord, "example_en"> &
  Partial<Pick<RawVocabWord, "example_ja" | "example_zh" | "example_vi" | "example_es">>;

export function getLocalizedMeaning(word: MeaningFields, locale: string): string {
  const meanings: Record<string, string | undefined> = {
    ja: word.meaning_ja,
    "zh-Hans": word.meaning_zh,
    vi: word.meaning_vi,
    es: word.meaning_es,
  };
  const meaning = meanings[locale];
  // A placeholder like "【weather】" is worse than the English it wraps.
  return isTranslated(meaning, word.meaning_en, locale) ? meaning : word.meaning_en;
}

export function getLocalizedExampleEn(word: ExampleFields, locale: string): string {
  const examples: Record<string, string | undefined> = {
    ja: word.example_ja,
    "zh-Hans": word.example_zh,
    vi: word.example_vi,
    es: word.example_es,
  };
  const example = examples[locale];
  return isTranslated(example, word.example_en, locale) ? example : word.example_en;
}
