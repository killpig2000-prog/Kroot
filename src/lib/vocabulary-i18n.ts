import type { RawVocabWord } from "@/lib/vocabulary-data/types";

export function getLocalizedMeaning(word: RawVocabWord, locale: string): string {
  const meanings: Record<string, string | undefined> = {
    ja: word.meaning_ja,
    "zh-Hans": word.meaning_zh,
    vi: word.meaning_vi,
    es: word.meaning_es,
  };
  return meanings[locale] || word.meaning_en;
}

export function getLocalizedExampleEn(word: RawVocabWord, locale: string): string {
  const examples: Record<string, string | undefined> = {
    ja: word.example_ja_en,
    "zh-Hans": word.example_zh_en,
    vi: word.example_vi_en,
    es: word.example_es,
  };
  return examples[locale] || word.example_en;
}
