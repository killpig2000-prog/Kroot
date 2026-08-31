import type { CefrLevel } from "@/lib/tree";

export type RawVocabWord = {
  level: CefrLevel;
  korean: string;
  romanization: string;
  meaning_en: string;
  example_kr: string;
  example_en: string;
  // Optional shared-root key into VOCAB_ROOTS — shows a "bonus root" panel on this card.
  root?: string;
  // Localized meanings and examples (applied via overlay in vocabulary.ts)
  // Spanish
  meaning_es?: string;
  example_es?: string;
  // Japanese
  meaning_ja?: string;
  example_ja?: string;
  // Chinese (Simplified)
  meaning_zh?: string;
  example_zh?: string;
  // Vietnamese
  meaning_vi?: string;
  example_vi?: string;
};
