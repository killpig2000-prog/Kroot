import type { CefrLevel } from "@/lib/tree";
import type { RawPrompt, WritingGenre } from "@/lib/writing-data/types";
import { DAILY_LIFE_PROMPTS } from "@/lib/writing-data/daily-life";

export type Prompt = RawPrompt & { key: string };

/** Display metadata per writing genre — shared by the map page and the session. */
export const WRITING_GENRE_META: Record<WritingGenre, { icon: string; label: string; blurb: string }> = {
  journal: { icon: "📔", label: "Journal", blurb: "Your own day, in your own words" },
  reply: { icon: "💬", label: "Replies", blurb: "Someone wrote to you — write back" },
  description: { icon: "🖼️", label: "Description", blurb: "Paint a person, a place, a thing, a trend" },
  opinion: { icon: "🗣️", label: "Opinion", blurb: "Take a side and say why" },
};

/**
 * The key a completed prompt is stored under.
 *
 * It used to be `writing:{level}:{prompt_kr}`, but prompt_kr is the
 * *instruction* ("친구의 메시지에 답장해 보세요."), which every prompt in a
 * genre shares — all 39 replies in a level collapsed onto one key, and 936
 * prompts onto 474. One finished chapter therefore marked its whole genre
 * complete, counted ~13 chapters against the 3-a-day cap, filled the
 * dashboard's writing bar, and left the assemble boards with no distractors
 * to draw from (getSiblingPrompts excludes by key).
 *
 * example_kr is the model answer, and is unique across all 936 prompts — see
 * the uniqueness test in writing.test.ts, which is what was missing.
 */
function promptKey(p: RawPrompt): string {
  return `writing:${p.level}:${p.genre}:${p.example_kr}`;
}

export function getPromptsForLevel(level: CefrLevel): Prompt[] {
  return DAILY_LIFE_PROMPTS.filter((p) => p.level === level).map((p) => ({
    ...p,
    key: promptKey(p),
  }));
}

/** Prompts per chapter — small on purpose, since every board is a tile puzzle checked on the spot. */
export const CHAPTER_SIZE = 3;

// Each genre block (39 prompts) divides evenly into CHAPTER_SIZE, so a
// chapter never mixes genres.
export function getChaptersForLevel(level: CefrLevel): Prompt[][] {
  const prompts = getPromptsForLevel(level);
  const chapters: Prompt[][] = [];
  for (let i = 0; i < prompts.length; i += CHAPTER_SIZE) {
    chapters.push(prompts.slice(i, i + CHAPTER_SIZE));
  }
  return chapters;
}

export type ChapterStatus = "done" | "current" | "locked";

// Chapter N opens once chapter N-1 is done, one at a time. It used to open a
// rolling window of three, which paired with the old daily cap: the AI grader
// cost money per submission, so the notebook let you roam a little and then
// stopped you for the day. The boards are checked on the spot now and cost
// nothing to run, so finishing one chapter is what opens the next — and
// nothing else stops you.
//
// (Vocabulary has a function of the same shape, but its chapter list is not
// gated by it — every word there is open from the start, on purpose.)
export function getChapterStatuses(chapters: Prompt[][], completedKeys: Set<string>): ChapterStatus[] {
  const statuses: ChapterStatus[] = [];
  let previousDone = true;
  for (const chapter of chapters) {
    const done = chapter.length > 0 && chapter.every((p) => completedKeys.has(p.key));
    statuses.push(done ? "done" : previousDone ? "current" : "locked");
    previousDone = done;
  }
  return statuses;
}

/**
 * Nearby prompts of the same level and genre — the distractor pool for the
 * assemble boards. Excludes the chapter's own prompts; nearest chapters first
 * so A1's distractors stay A1-easy.
 */
export function getSiblingPrompts(level: CefrLevel, chapter: Prompt[], max = 12): Prompt[] {
  const all = getPromptsForLevel(level);
  const genre = chapter[0]?.genre;
  const own = new Set(chapter.map((p) => p.key));
  const firstIdx = all.findIndex((p) => p.key === chapter[0]?.key);
  return all
    .map((p, i) => ({ p, d: Math.abs(i - firstIdx) }))
    .filter(({ p }) => p.genre === genre && !own.has(p.key))
    .sort((a, b) => a.d - b.d)
    .slice(0, max)
    .map(({ p }) => p);
}

export const MINUTES_PER_CHAPTER = 8;
export const MIN_RESPONSE_LENGTH = 3;
