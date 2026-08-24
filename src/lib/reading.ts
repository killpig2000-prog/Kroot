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

// Chapters open in a rolling window: the first unfinished one plus the next
// few, so one hard chapter never blocks the whole library.
const OPEN_WINDOW = 3;

export function getChapterStatuses(chapters: Passage[][], completedKeys: Set<string>): ChapterStatus[] {
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

export const MINUTES_PER_PASSAGE = 4;
