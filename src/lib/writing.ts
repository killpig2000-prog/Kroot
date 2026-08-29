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

export function getPromptsForLevel(level: CefrLevel): Prompt[] {
  return DAILY_LIFE_PROMPTS.filter((p) => p.level === level).map((p) => ({
    ...p,
    key: `writing:${p.level}:${p.prompt_kr}`,
  }));
}

/** Prompts per chapter — one API call grades the whole chapter at once. */
export const CHAPTER_SIZE = 4;

// Each genre block (40 prompts) divides evenly into CHAPTER_SIZE, so a
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

// Chapters open in a rolling window: the first unwritten one plus the next
// few, so one awkward chapter never blocks the whole notebook.
const OPEN_WINDOW = 3;

export function getChapterStatuses(chapters: Prompt[][], completedKeys: Set<string>): ChapterStatus[] {
  const done = chapters.map(
    (chapter) => chapter.length > 0 && chapter.every((p) => completedKeys.has(p.key))
  );
  const firstOpen = done.findIndex((d) => !d);
  return done.map((d, i) => {
    if (d) return "done";
    if (firstOpen >= 0 && i < firstOpen + OPEN_WINDOW) return "current";
    return "locked";
  });
}

/** UTC start of today, as an ISO string — the daily-limit boundary. */
export function utcDayStartISO(): string {
  return new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
}

/** At most this many chapters can be finished per UTC day. */
export const CHAPTERS_PER_DAY = 3;

/** prompt_keys completed today (UTC) — the input to the daily chapter cap. */
export function promptKeysCompletedToday(
  rows: { prompt_key: string; completed_at: string }[] | null | undefined
): Set<string> {
  const dayStart = utcDayStartISO();
  return new Set((rows ?? []).filter((r) => r.completed_at >= dayStart).map((r) => r.prompt_key));
}

/** How many whole chapters were finished today, given today's completed prompt_keys. */
export function chaptersCompletedToday(chapters: Prompt[][], todayKeys: Set<string>): number {
  return chapters.filter((chapter) => chapter.length > 0 && chapter.every((p) => todayKeys.has(p.key)))
    .length;
}

export const MINUTES_PER_CHAPTER = 8;
export const MIN_RESPONSE_LENGTH = 3;
