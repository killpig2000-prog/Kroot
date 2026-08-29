import WORD_NOTES from "@/lib/vocabulary-data/word-notes.json";

// Generated per-word memos (scripts/gen-word-notes.mts): either a hanja
// breakdown like "시(試 to test) + 험(驗 to examine)" for Sino-Korean words,
// a loanword origin like "from English \"coffee\"", or "" for native words.
export type Morpheme = { syllable: string; hanja: string; gloss: string };
export type WordNote = { parts: Morpheme[]; origin?: never } | { origin: string; parts?: never };

export function parseMorphemeNote(note: string): WordNote | null {
  if (note.startsWith("from ")) return { origin: note.slice(5) };
  const parts = Array.from(note.matchAll(/([가-힣]+)\(([^\s)]+) ([^)]+)\)/g)).map((m) => ({
    syllable: m[1],
    hanja: m[2],
    gloss: m[3],
  }));
  return parts.length >= 2 ? { parts } : null;
}

export function getWordNote(korean: string): WordNote | null {
  const raw = (WORD_NOTES as Record<string, string>)[korean];
  return raw ? parseMorphemeNote(raw) : null;
}

/** The word's hanja spelling ("책상" → "冊床"), or null for native/loan words. */
export function hanjaOf(korean: string): string | null {
  const note = getWordNote(korean);
  return note?.parts ? note.parts.map((p) => p.hanja).join("") : null;
}

// A word's study status, from how many times it's been reviewed — shared by
// the study card's stamp and the unit preview's per-word markers. Three plain
// states (not a growth metaphor) so a glance tells you what to do: nothing
// yet, still coming back to it, or done.
export const WORD_STATUSES = [
  { key: "new", label: "New" },
  { key: "learning", label: "Learning" },
  { key: "known", label: "Known" },
] as const;

export function wordStatus(reviews: number): number {
  if (reviews <= 0) return 0;
  if (reviews <= 3) return 1;
  return 2;
}
