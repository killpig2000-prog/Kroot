import { SLANG, type SlangEntry } from "@/lib/slang";

// Public share-page slugs for slang terms (/slang/[slug]) — no login
// required. Romanizations are already URL-safe and unique across the list,
// so they double as the slug directly; slugify() only guards against a
// future entry that isn't.

export type PublicSlangEntry = SlangEntry & { slug: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildEntries(): PublicSlangEntry[] {
  const used = new Set<string>();
  return SLANG.map((entry) => {
    const base = slugify(entry.romanization) || slugify(entry.kr);
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...entry, slug };
  });
}

export const PUBLIC_SLANG: PublicSlangEntry[] = buildEntries();

const BY_SLUG = new Map(PUBLIC_SLANG.map((e) => [e.slug, e]));

export function getSlangBySlug(slug: string): PublicSlangEntry | undefined {
  return BY_SLUG.get(slug);
}

// A few more terms to cross-link — same vibe first, then anything else.
export function relatedSlang(entry: PublicSlangEntry, count = 6): PublicSlangEntry[] {
  const sameVibe = PUBLIC_SLANG.filter((e) => e.slug !== entry.slug && e.vibe === entry.vibe);
  const rest = PUBLIC_SLANG.filter((e) => e.slug !== entry.slug && e.vibe !== entry.vibe);
  return [...sameVibe, ...rest].slice(0, count);
}
