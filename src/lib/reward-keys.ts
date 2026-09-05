import { REVIEW_ITEM_KEY } from "@/lib/activity";

// One place that spells the reward item keys, because the server pays for a
// key exactly once (migration 0063 / public.reward_grants) — a key that
// changes shape between releases would silently re-open the same chapter for
// a second payout, and a key that collides between two chapters would pay
// only one of them. Keys are `<skill>:<stable identity>`; they must stay
// stable forever, so they are built from content identities: a passage,
// lesson or challenge key where the content has one, otherwise the same
// (level|topic + chapter index) pair the routes themselves address chapters
// by. Never an index into a runtime-filtered or sorted list, and never
// anything locale-dependent — both change under the learner and would
// re-open a paid chapter. Reordering the content files would too, so
// chapters get appended, not inserted.

/** A writing chapter: one level's Nth chapter, e.g. "writing:A1:0". */
export function writingChapterKey(level: string, chapterIndex: number): string {
  return `writing:${level}:${chapterIndex}`;
}

/** A reading passage, keyed by the passage's own content key. */
export function readingPassageKey(passageKey: string): string {
  return `reading:${passageKey}`;
}

/** A grammar lesson, keyed by the lesson's own content key. */
export function grammarLessonKey(lessonKey: string): string {
  return `grammar:${lessonKey}`;
}

/** A pronunciation practice chapter (a sound group's word set). */
export function pronunciationChapterKey(chapterKey: string): string {
  return `pronunciation:${chapterKey}`;
}

/** One pronunciation Challenge run, keyed by the challenge's own key. */
export function challengeKey(key: string): string {
  return `challenge:${key}`;
}

/**
 * A vocabulary Day: a topic's Nth Day at a given level, e.g. "vocab:daily-life:A1:2".
 *
 * The level has to be in the key. There is one vocabulary topic
 * ("daily-life") reused at every CEFR level, each with its own Day 0..N, so
 * a key without the level collided between levels — Day 2 of A1 and Day 2 of
 * B2 paid the same reward_grants row, and whichever level's payout landed
 * second silently earned nothing. Fixed 2026-09-05; the level segment did
 * not exist before, so every learner's next Day at each level pays once more
 * on the level it's actually for, rather than being permanently blocked by
 * a payout another level already made under the same key.
 */
export function vocabChapterKey(topicKey: string, level: string, chapterIndex: number): string {
  return `vocab:${topicKey}:${level}:${chapterIndex}`;
}

/** A listening dialogue, keyed by its own id. */
export function listeningDialogueKey(dialogueId: string): string {
  return `listening:${dialogueId}`;
}

/**
 * The word-bank SRS review. Repetition is the whole feature, so this one
 * isn't paid once ever — the server rewrites this sentinel into a per-day key
 * and pays one review session per calendar day.
 */
export const reviewSessionKey = REVIEW_ITEM_KEY;
