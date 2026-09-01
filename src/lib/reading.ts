import type { CefrLevel } from "@/lib/tree";
import type { RawPassage, ReadingQuestion } from "@/lib/reading-data/types";
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

// Chapter N opens once chapter N-1 is done, one at a time. It used to open a
// rolling window of three, matching writing's old shape — but a reading
// chapter is a single passage, checked instantly and free to run, so there
// was never a cost reason to let three sit open at once. Finishing the one
// in front of you is what opens the next.
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

export type PassageLine = { kr: string; en: string };

// Structured genres author real \n line breaks (speaker turns, sign lines,
// steps, paragraphs) — split ONLY on those so a multi-sentence turn or step
// doesn't get chopped mid-line. Flowing prose (diary/story/explainer/none)
// splits sentence-by-sentence instead, which is the unit the reader reveals
// a translation for.
const STRUCTURED_GENRES = new Set([
  "dialogue",
  "message",
  "notice",
  "email",
  "instruction",
  "interview",
]);

export function splitPassageLines(passage: Passage): PassageLine[] {
  const structured = STRUCTURED_GENRES.has(passage.genre ?? "");
  const split = (text: string) =>
    (structured ? text.split("\n") : text.split(/(?<=[.!?])\s+/)).filter(Boolean);
  const kr = split(passage.body_kr);
  const en = split(passage.body_en);
  if (kr.length === 0) return [];

  // The two languages don't always break into the same number of pieces — one
  // Korean sentence can land as two English ones, and prose splitting on
  // [.!?] also breaks after "Dr." and friends. Zipping by index then showed
  // every later line the translation of the line before it and left the last
  // line blank (29 of 960 passages). Group instead: each Korean line takes its
  // proportional share of the English, so nothing is dropped or duplicated and
  // the drift stays local to the mismatch.
  if (kr.length === en.length) {
    return kr.map((line, i) => ({ kr: line, en: en[i] }));
  }
  return kr.map((line, i) => {
    const from = Math.round((i * en.length) / kr.length);
    const to = Math.round(((i + 1) * en.length) / kr.length);
    return { kr: line, en: en.slice(from, Math.max(to, from + 1)).join(" ") };
  });
}

/** Rough reading length, shown in the reader's toolbar. */
export function countKoreanWords(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

// Words too common to be evidence of anything.
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "of", "to", "in", "on", "at", "for", "with", "from", "by",
  "as", "is", "are", "was", "were", "be", "been", "am", "do", "does", "did", "not", "no", "she",
  "he", "it", "they", "them", "their", "his", "her", "its", "you", "your", "i", "my", "we", "our",
  "this", "that", "these", "those", "there", "what", "who", "when", "where", "why", "how", "which",
  "will", "would", "can", "could", "have", "has", "had", "about", "than", "then", "so", "up", "out",
]);

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => (w.length > 2 || /^\d+$/.test(w)) && !STOP_WORDS.has(w));
}

/**
 * The line of the passage a question's correct answer comes from, so the quiz
 * can point at it instead of just marking the answer red or green. Scored by
 * content-word overlap against the English text — no per-question authoring
 * needed, and it returns null rather than guessing when nothing clearly wins.
 */
export function findEvidenceLine(lines: PassageLine[], question: ReadingQuestion): number | null {
  const answer = question.options[question.answerIndex] ?? "";
  const answerWords = contentWords(answer);
  const questionWords = contentWords(question.question_en);
  if (answerWords.length === 0) return null;

  let best = -1;
  let bestScore = 0;
  lines.forEach((line, i) => {
    const words = new Set(contentWords(line.en));
    if (words.size === 0) return;
    // The answer is the evidence; the question's own words only break ties.
    let score = answerWords.filter((w) => words.has(w)).length * 2;
    score += questionWords.filter((w) => words.has(w)).length * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 2 ? best : null;
}
