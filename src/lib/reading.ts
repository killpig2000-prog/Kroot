import type { CefrLevel } from "@/lib/tree";
import type { RawPassage } from "@/lib/reading-data/types";
import { DAILY_LIFE_PASSAGES } from "@/lib/reading-data/daily-life";

export type Passage = RawPassage & { key: string };

export function getPassagesForLevel(level: CefrLevel): Passage[] {
  return DAILY_LIFE_PASSAGES.filter((p) => p.level === level).map((p) => ({
    ...p,
    key: `reading:${p.level}:${p.title_kr}`,
  }));
}

// One passage = one chapter, so the "map" is just the level's passage list.
export function getChaptersForLevel(level: CefrLevel): Passage[][] {
  return getPassagesForLevel(level).map((p) => [p]);
}

export type ChapterStatus = "done" | "current" | "locked";

export function getChapterStatuses(chapters: Passage[][], completedKeys: Set<string>): ChapterStatus[] {
  const statuses: ChapterStatus[] = [];
  let previousDone = true;
  for (const chapter of chapters) {
    const done = chapter.length > 0 && chapter.every((p) => completedKeys.has(p.key));
    statuses.push(done ? "done" : previousDone ? "current" : "locked");
    previousDone = done;
  }
  return statuses;
}

export const MINUTES_PER_PASSAGE = 4;
