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

export const MINUTES_PER_PROMPT = 5;
export const MIN_RESPONSE_LENGTH = 5;
