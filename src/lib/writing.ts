import type { CefrLevel } from "@/lib/tree";
import type { RawPrompt } from "@/lib/writing-data/types";
import { DAILY_LIFE_PROMPTS } from "@/lib/writing-data/daily-life";

export type Prompt = RawPrompt & { key: string };

export function getPromptsForLevel(level: CefrLevel): Prompt[] {
  return DAILY_LIFE_PROMPTS.filter((p) => p.level === level).map((p) => ({
    ...p,
    key: `writing:${p.level}:${p.prompt_kr}`,
  }));
}

// One prompt = one chapter, so the "map" is just the level's prompt list.
export function getChaptersForLevel(level: CefrLevel): Prompt[][] {
  return getPromptsForLevel(level).map((p) => [p]);
}

export type ChapterStatus = "done" | "current" | "locked";

// Pages open in a rolling window: the first unwritten one plus the next few,
// so one awkward prompt never blocks the whole notebook.
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

/** UTC start of today, as an ISO string — the writing day boundary. */
export function utcDayStartISO(): string {
  return new Date().toISOString().slice(0, 10) + "T00:00:00.000Z";
}

/**
 * Free plan writes one chapter per UTC day. Returns the prompt_key completed
 * today (so re-grading that same chapter stays allowed), or null if the user
 * hasn't written yet today.
 */
export function chapterWrittenToday(
  rows: { prompt_key: string; completed_at: string }[] | null | undefined
): string | null {
  const dayStart = utcDayStartISO();
  return rows?.find((r) => r.completed_at >= dayStart)?.prompt_key ?? null;
}

export const MINUTES_PER_PROMPT = 5;
export const MIN_RESPONSE_LENGTH = 5;
