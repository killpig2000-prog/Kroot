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
};
