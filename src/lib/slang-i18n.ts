import SLANG_I18N from "@/lib/slang-i18n.json";
import type { SlangEntry } from "@/lib/slang";

// Slang meanings, literal glosses, example translations and origin notes in
// the learner's UI language. The Korean (kr, example.kr, romanization) never
// changes — only the explanation around it.
//
// Server-only by convention: pages localize before handing entries to the
// client components, so the four-language table never ships in a bundle.
//
// Hand-checked table (2026-09-13), so no isTranslated() guard: its "English
// left standing" rule rejects notes that quote English on purpose
// ('work-life balance', FIRE, YouTube).

type Fields = { literal?: string; meaning?: string; example?: string; origin?: string };

const TABLE = SLANG_I18N as Record<string, Record<string, Fields>>;

/** The entry with its explanation in `locale`; English wherever a field is missing. */
export function localizeSlang<T extends SlangEntry>(entry: T, locale: string): T {
  const t = TABLE[entry.kr]?.[locale];
  if (!t) return entry;
  const pick = (value: string | undefined, english: string) => value?.trim() || english;
  return {
    ...entry,
    literal: pick(t.literal, entry.literal),
    meaning: pick(t.meaning, entry.meaning),
    // `en` is "the learner's language" from here on — the cards read it as
    // the translation line under the Korean example.
    example: { ...entry.example, en: pick(t.example, entry.example.en) },
    origin: entry.origin && pick(t.origin, entry.origin),
  };
}
