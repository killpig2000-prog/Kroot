import type { CefrLevel } from "@/lib/tree";
import { DAILY_LIFE_PASSAGES } from "@/lib/reading-data/daily-life";
import type { RawPassage } from "@/lib/reading-data/types";

// Public dictionary entries for the SEO reading pages (/korean-reading/[slug]).
// Passages have no authored slug — `getPassagesForLevel`'s runtime key
// (`reading:${level}:${title_kr}`) isn't URL-safe — so slugs are derived from
// level + English title here, deduped with a counter suffix, same recipe as
// vocab-slugs.ts.

export type PublicPassage = RawPassage & { slug: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildEntries(): PublicPassage[] {
  const used = new Set<string>();
  return DAILY_LIFE_PASSAGES.map((passage) => {
    const base = `${passage.level.toLowerCase()}-${slugify(passage.title_en)}` || passage.level.toLowerCase();
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...passage, slug };
  });
}

export const PUBLIC_READING_PASSAGES: PublicPassage[] = buildEntries();

const BY_SLUG = new Map(PUBLIC_READING_PASSAGES.map((p) => [p.slug, p]));

export function getPassageBySlug(slug: string): PublicPassage | undefined {
  return BY_SLUG.get(slug);
}

export function getPublicPassagesByLevel(level: CefrLevel): PublicPassage[] {
  return PUBLIC_READING_PASSAGES.filter((p) => p.level === level);
}
