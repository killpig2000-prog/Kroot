import { GRAMMAR_LESSONS } from "@/lib/grammar";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { getPassagesForLevel } from "@/lib/reading";
import { getPromptsForLevel } from "@/lib/writing";
import { chapterClearStats } from "@/lib/pronunciation";
import { getWordsForTopic } from "@/lib/vocabulary";
import { ELIGIBILITY } from "@/lib/promotion-test";
import type { CefrLevel } from "@/lib/tree";

// The six practice skills as compact progress rows. This card used to live on
// the dashboard; it moved to My account (2026-08-30) because the Garden is a
// "what do I do today" page and this is a "how am I doing" one. The dashboard
// keeps its own tally only to feed LevelMap's overall percentage.
export const PRACTICE_SKILLS = [
  { key: "grammar", href: "/grammar", kr: "문", bg: "#EEF2FF", color: "#423AC5" },
  { key: "vocabulary", href: "/vocabulary", kr: "단", bg: "#F5F3FF", color: "#6B33CC" },
  { key: "listening", href: "/listening", kr: "듣", bg: "#F0FDF4", color: "#3E7C59" },
  { key: "reading", href: "/reading", kr: "읽", bg: "#EFF6FF", color: "#3363CC" },
  { key: "writing", href: "/writing", kr: "쓰", bg: "#FFFBEB", color: "#C47A25" },
  { key: "pronunciation", href: "/speaking", kr: "발", bg: "#F0FDFA", color: "#228980" },
] as const;

export type SkillTally = { done: number; total: number; percent: number };

// Cap the denominator at a reachable near-term goal instead of the whole
// level's library — the content library grew much faster than any learner's
// pace, so "done of everything" reads as permanently near-empty.
function tally(doneKeys: Set<string>, levelKeys: string[], cap?: number): SkillTally {
  const done = levelKeys.filter((k) => doneKeys.has(k)).length;
  const total = cap ? Math.min(levelKeys.length, cap) : levelKeys.length;
  const capped = Math.min(done, total);
  return { done: capped, total, percent: total ? Math.round((capped / total) * 100) : 0 };
}

export type SkillProgressInput = {
  cefr: CefrLevel;
  grammarKeys: string[];
  vocabKeys: string[];
  listeningIds: string[];
  readingKeys: string[];
  writingKeys: string[];
  speakingKeys: string[];
};

export function computeSkillProgress(input: SkillProgressInput): Record<string, SkillTally> {
  const { cefr } = input;
  return {
    grammar: tally(
      new Set(input.grammarKeys),
      GRAMMAR_LESSONS.filter((l) => l.level === cefr).map((l) => l.key)
    ),
    vocabulary: tally(
      new Set(input.vocabKeys),
      getWordsForTopic("daily-life", cefr).map((w) => w.key),
      ELIGIBILITY.targetMasteredWords
    ),
    listening: tally(
      new Set(input.listeningIds),
      DIALOGUES.filter((d) => d.level === cefr).map((d) => d.id),
      20
    ),
    reading: tally(new Set(input.readingKeys), getPassagesForLevel(cefr).map((p) => p.key), 20),
    writing: tally(new Set(input.writingKeys), getPromptsForLevel(cefr).map((p) => p.key), 20),
    pronunciation: (() => {
      // A chapter counts as done once every word in it has been attempted at
      // least once — matches the unlock gate on /speaking.
      const { done, total } = chapterClearStats(new Set(input.speakingKeys));
      return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
    })(),
  };
}
