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
