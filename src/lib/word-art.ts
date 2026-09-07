import manifest from "../../public/word-art/manifest.json";

// Hand-drawn word pictures (public/word-art/*.svg, see STYLE.md there). The
// manifest maps the Korean headword to its file. Pictures are an A1/A2
// thing on purpose — above that the word stands on its own as text (user
// decision, 2026-09-07): abstract B1+ vocabulary doesn't draw well, and a
// forced picture teaches the wrong thing.
const PICTURED_LEVELS = new Set(["A1", "A2"]);

const FILES = manifest as Record<string, string>;

/** Public URL of the picture for this word at this level, or null when there isn't one. */
export function wordArtFor(korean: string, level: string): string | null {
  if (!PICTURED_LEVELS.has(level)) return null;
  const file = FILES[korean.trim()];
  return file ? `/word-art/${file}` : null;
}

import textBadges from "../../public/word-art/text-badges.json";

// Words that deliberately have NO picture (people and roles — "사람은 안
// 그린다", user decision 2026-09-07) carry a one-line note instead, so the
// card stays the same height as a pictured neighbour and never reads as
// "the one they forgot to draw". Same A1/A2 gate as the pictures.
const BADGES = textBadges as Record<string, { note: string; hint?: string }>;

/** The one-line note for a word that stands as text on purpose, or null. */
export function textBadgeFor(korean: string, level: string): string | null {
  if (!PICTURED_LEVELS.has(level)) return null;
  const k = korean.trim();
  if (FILES[k]) return null;
  return BADGES[k]?.note ?? null;
}
