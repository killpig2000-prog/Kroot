import type { CefrLevel } from "@/lib/tree";
import { DAILY_LIFE_PROMPTS } from "@/lib/writing-data/daily-life";
import type { RawPrompt, WritingGenre } from "@/lib/writing-data/types";

// Public dictionary entries for the SEO writing pages (/korean-writing/[slug]).
// Prompts have no authored slug — the in-app key (`writing:${level}:${genre}:${example_kr}`)
// isn't URL-safe — so slugs are derived from level + genre + English example
// sentence here, deduped with a counter suffix, same recipe as
// vocab-slugs.ts/reading-slugs.ts. example_en (not prompt_en) is the seed:
// prompt_en repeats ~39x per genre (it's the shared instruction), while
// example_en is unique per prompt (see writing.ts's promptKey comment).

export type PublicPrompt = RawPrompt & { slug: string };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildEntries(): PublicPrompt[] {
  const used = new Set<string>();
  return DAILY_LIFE_PROMPTS.map((prompt) => {
    const base =
      `${prompt.level.toLowerCase()}-${prompt.genre}-${slugify(prompt.example_en)}` ||
      `${prompt.level.toLowerCase()}-${prompt.genre}`;
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return { ...prompt, slug };
  });
}

export const PUBLIC_WRITING_PROMPTS: PublicPrompt[] = buildEntries();

const BY_SLUG = new Map(PUBLIC_WRITING_PROMPTS.map((p) => [p.slug, p]));

export function getPromptBySlug(slug: string): PublicPrompt | undefined {
  return BY_SLUG.get(slug);
}

export function getPublicPromptsByLevel(level: CefrLevel): PublicPrompt[] {
  return PUBLIC_WRITING_PROMPTS.filter((p) => p.level === level);
}

export function getPublicPromptsByLevelAndGenre(level: CefrLevel, genre: WritingGenre): PublicPrompt[] {
  return PUBLIC_WRITING_PROMPTS.filter((p) => p.level === level && p.genre === genre);
}
