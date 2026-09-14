import WORD_NOTES from "@/lib/vocabulary-data/word-notes.json";

// Generated per-word memos (scripts/gen-word-notes.mts): a loanword origin
// like "from English \"coffee\"", a hanja breakdown like "시(試 to test) +
// 험(驗 to examine)" for Sino-Korean words, or "" for native words. Only the
// loanword origin is shown in the app (2026-09-15, user: no hanja anywhere in
// vocab, including the Sino-Korean etymology line) — the hanja breakdown
// half of this data is generated but unused.
export type WordNote = { origin: string };

export function parseMorphemeNote(note: string): WordNote | null {
  return note.startsWith("from ") ? { origin: note.slice(5) } : null;
}

export function getWordNote(korean: string): WordNote | null {
  const raw = (WORD_NOTES as Record<string, string>)[korean];
  return raw ? parseMorphemeNote(raw) : null;
}

// A word's study status, from how many times it's been reviewed — shared by
// the study card's stamp and the unit preview's per-word markers. Three plain
// states (not a growth metaphor) so a glance tells you what to do: nothing
// yet, still coming back to it, or done.
export const WORD_STATUSES = [{ key: "new" }, { key: "learning" }, { key: "known" }] as const;

export function wordStatus(reviews: number): number {
  if (reviews <= 0) return 0;
  if (reviews <= 3) return 1;
  return 2;
}
