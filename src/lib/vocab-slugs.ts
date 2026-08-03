import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import type { RawVocabWord } from "@/lib/vocabulary-data/types";
import { DAILY_LIFE_WORDS } from "@/lib/vocabulary-data/daily-life";

// Public dictionary entries for the SEO word pages (/words/[slug]).
// Slugs are derived from romanization + English meaning ("mul-water") so the
// URL itself carries the search keywords, and deduped with a counter suffix.

export type PublicVocabWord = RawVocabWord & { slug: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    // Keep only the part before a slash/paren — "rice / a meal" → "rice"
    .split(/[/(]/)[0]
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildEntries(): PublicVocabWord[] {
  const used = new Set<string>();
  return DAILY_LIFE_WORDS.map((word) => {
    const base =
      `${slugify(word.romanization)}-${slugify(word.meaning_en)}`.replace(/^-|-$/g, "") ||
      slugify(word.romanization);
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...word, slug };
  });
}

export const PUBLIC_VOCAB_WORDS: PublicVocabWord[] = buildEntries();

const BY_SLUG = new Map(PUBLIC_VOCAB_WORDS.map((w) => [w.slug, w]));

export function getWordBySlug(slug: string): PublicVocabWord | undefined {
  return BY_SLUG.get(slug);
}

export function getWordsByLevel(level: CefrLevel): PublicVocabWord[] {
  return PUBLIC_VOCAB_WORDS.filter((w) => w.level === level);
}

export function isCefrLevelSlug(value: string): value is Lowercase<CefrLevel> {
  return (LEVEL_ORDER as string[]).includes(value.toUpperCase());
}

// A few same-level neighbours to cross-link from each word page.
export function relatedWords(word: PublicVocabWord, count = 6): PublicVocabWord[] {
  const sameLevel = getWordsByLevel(word.level);
  const index = sameLevel.findIndex((w) => w.slug === word.slug);
  const related: PublicVocabWord[] = [];
  for (let offset = 1; related.length < count && offset < sameLevel.length; offset++) {
    const next = sameLevel[(index + offset) % sameLevel.length];
    if (next.slug !== word.slug) related.push(next);
  }
  return related;
}
