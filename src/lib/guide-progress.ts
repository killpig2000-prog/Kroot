import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel } from "@/lib/tree";
import { GRAMMAR_GROUPS, lessonByKey } from "@/lib/grammar";
import { getChaptersForTopic, getChapterStatuses } from "@/lib/vocabulary";
import { DIALOGUES } from "@/lib/listening-dialogues";
import { SITUATIONS } from "@/lib/listening";
import { getPassagesForLevel } from "@/lib/reading";
import { CHAPTER_SIZE, getPromptsForLevel } from "@/lib/writing";
import { NAILED_THRESHOLD, chapterBlurb, orderedChapters } from "@/lib/pronunciation";
import { computeEligibility, type Eligibility } from "@/lib/promotion-server";

// "You are here" for the Guide roadmaps. Each station on a roadmap has ONE
// completion condition, read from the tables the feature pages already write
// (no new columns): the first station whose condition is unmet is where the
// learner is; everything before it reads as done, everything after as
// upcoming. All conditions are evaluated at the learner's current grade.

export type GuideStationKey = "hangul" | "grammar" | "vocab" | "listen" | "pron" | "write" | "read" | "slang";
export type GuideStationStatus = "done" | "current" | "upcoming";

export type GuideStationProgress = {
  stationId: GuideStationKey;
  /** The station's completion condition holds. */
  met: boolean;
  /** Done: "40 letters". Current: "13 / 60 learned · Unit 2 of 6". */
  detail: string;
  /** ISO timestamp of when the condition was first met, when the data has one. */
  doneAt?: string;
  /** 0-100 toward the condition — drives the bar on the current station. */
  percent: number;
  /** Where "Continue" goes and what it says while this is the current station. */
  ctaHref: string;
  ctaLabel: string;
  /** One-line "why not yet" shown while the station is still upcoming. */
  note: string;
};

export type GuideStationView = GuideStationProgress & { status: GuideStationStatus };

export type GuideProgress = {
  grade: CefrLevel;
  stations: Record<GuideStationKey, GuideStationProgress>;
  eligibility: Eligibility;
};

// Station targets. Vocabulary/reading/writing use a near-term slice of the
// level's library rather than all of it — the same reasoning as the
// dashboard's capped tallies: the content has grown far past any learner's
// pace, so "all of A1" would never read as done.
export const VOCAB_STATION_UNITS = 6; // 6 × 10 words — the six titled units
export const READING_STATION_PASSAGES = 10;
export const WRITING_STATION_PROMPTS = 5;
export const LISTENING_EASIER_AFTER_WORDS = 30;
const VOCAB_TOPIC = "daily-life";

const pct = (done: number, total: number) => (total > 0 ? Math.round((Math.min(done, total) / total) * 100) : 0);
const maxIso = (dates: string[]): string | undefined =>
  dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : undefined;
/** The date the n-th item (1-based) was completed — i.e. when a "reach N" target was first met. */
const nthIso = (dates: string[], n: number): string | undefined => {
  const sorted = [...dates].sort();
  return sorted.length >= n ? sorted[n - 1] : undefined;
};

export async function getGuideProgress(
  supabase: SupabaseClient,
  userId: string,
  grade: CefrLevel,
): Promise<GuideProgress> {
  // One parallel batch — each query is a ~300ms round trip from Korea to us-east-1.
  // Every read degrades to "no rows" on error (e.g. a migration not yet applied).
  const [vocab, listening, grammar, reading, writing, speaking, slangXp, eligibility] = await Promise.all([
    supabase
      .from("vocabulary_progress")
      .select("word_key, created_at")
      .eq("user_id", userId)
      .not("last_reviewed_at", "is", null),
    supabase
      .from("listening_progress")
      .select("dialogue_id, completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null),
    supabase.from("grammar_progress").select("lesson_key, completed_at").eq("user_id", userId),
    supabase
      .from("reading_progress")
      .select("passage_key, created_at")
      .eq("user_id", userId)
      .not("last_reviewed_at", "is", null),
    supabase.from("writing_progress").select("prompt_key, completed_at").eq("user_id", userId),
    supabase.from("speaking_progress").select("prompt_key, best_score, completed_at").eq("user_id", userId),
    // The daily slang quiz keeps its "done today" flag in localStorage only;
    // its XP award (skill = "slang") is the one server-side trace of it.
    supabase.from("xp_events").select("created_at").eq("user_id", userId).eq("skill", "slang"),
    computeEligibility(supabase, userId, grade),
  ]);

  const vocabRows = (vocab.data ?? []) as { word_key: string; created_at: string }[];
  const listeningRows = (listening.data ?? []) as { dialogue_id: string; completed_at: string }[];
  const grammarRows = (grammar.data ?? []) as { lesson_key: string; completed_at: string }[];
  const readingRows = (reading.data ?? []) as { passage_key: string; created_at: string }[];
  const writingRows = (writing.data ?? []) as { prompt_key: string; completed_at: string }[];
  const speakingRows = (speaking.data ?? []) as { prompt_key: string; best_score: number; completed_at: string }[];
  const slangRows = (slangXp.data ?? []) as { created_at: string }[];

  const vocabByKey = new Map(vocabRows.map((r) => [r.word_key, r.created_at]));
  const wordsLearnedAtGrade = vocabRows.filter((r) => r.word_key.startsWith(`${VOCAB_TOPIC}:${grade}:`)).length;

  // --- Hangul -------------------------------------------------------------
  // The Hangul explorer records nothing server-side, so the alphabet counts
  // as done once the learner has moved past it: any progress in a later
  // skill (you can't review a Korean word without reading it), or a grade
  // above A1 (placed there by the onboarding quiz / a promotion test).
  const movedPastHangul =
    grade !== "A1" ||
    vocabRows.length > 0 ||
    listeningRows.length > 0 ||
    grammarRows.length > 0 ||
    readingRows.length > 0 ||
    writingRows.length > 0 ||
    speakingRows.length > 0 ||
    slangRows.length > 0;
  const hangul: GuideStationProgress = {
    stationId: "hangul",
    met: movedPastHangul,
    detail: movedPastHangul ? "40 letters" : "40 letters · about an hour",
    percent: movedPastHangul ? 100 : 0,
    ctaHref: "/hangul",
    ctaLabel: "Start with Hangul →",
    note: "Start here",
  };

  // --- Grammar: the "Start here" group ------------------------------------
  const startHere = GRAMMAR_GROUPS.find((g) => g.key === "start-here")?.lessonKeys ?? [];
  const grammarDoneAt = new Map(grammarRows.map((r) => [r.lesson_key, r.completed_at]));
  const grammarDone = startHere.filter((k) => grammarDoneAt.has(k));
  const nextLessonIdx = startHere.findIndex((k) => !grammarDoneAt.has(k));
  const nextLessonKey = nextLessonIdx >= 0 ? startHere[nextLessonIdx] : undefined;
  const nextLesson = nextLessonKey ? lessonByKey(nextLessonKey) : undefined;
  const grammarMet = startHere.length > 0 && grammarDone.length === startHere.length;
  const grammarStation: GuideStationProgress = {
    stationId: "grammar",
    met: grammarMet,
    detail: grammarMet
      ? `${startHere.length} lessons`
      : `${grammarDone.length} / ${startHere.length} lessons · Start here`,
    doneAt: grammarMet ? maxIso(grammarDone.map((k) => grammarDoneAt.get(k)!)) : undefined,
    percent: pct(grammarDone.length, startHere.length),
    ctaHref: nextLessonKey ? `/grammar/${nextLessonKey}` : "/grammar?group=start-here",
    // Short on purpose — lesson titles ("Korean word order (SOV)") wrap to three
    // lines inside a roadmap column.
    ctaLabel: nextLesson
      ? `${grammarDone.length ? "Continue" : "Start"} lesson ${nextLessonIdx + 1} →`
      : "Open Grammar →",
    note: grammarDone.length
      ? `${grammarDone.length} / ${startHere.length} lessons so far`
      : `Opens now · ${startHere.length} short lessons`,
  };

  // --- Vocabulary: the first six units of the current grade ---------------
  const units = getChaptersForTopic(VOCAB_TOPIC, grade).slice(0, VOCAB_STATION_UNITS);
  const unitStatuses = getChapterStatuses(units, new Set(vocabByKey.keys()));
  const stationWords = units.flat();
  const learnedWords = stationWords.filter((w) => vocabByKey.has(w.key));
  const vocabMet = stationWords.length > 0 && learnedWords.length === stationWords.length;
  const unitIdx = Math.max(0, unitStatuses.findIndex((s) => s !== "done"));
  const vocabStation: GuideStationProgress = {
    stationId: "vocab",
    met: vocabMet,
    detail: vocabMet
      ? `${stationWords.length} words`
      : `${learnedWords.length} / ${stationWords.length} learned · Unit ${unitIdx + 1} of ${units.length}`,
    doneAt: vocabMet ? maxIso(learnedWords.map((w) => vocabByKey.get(w.key)!)) : undefined,
    percent: pct(learnedWords.length, stationWords.length),
    ctaHref: `/vocabulary/${VOCAB_TOPIC}/session?chapter=${unitIdx}&level=${grade}`,
    ctaLabel: `${learnedWords.length ? "Continue" : "Start"} Unit ${unitIdx + 1} →`,
    note: learnedWords.length
      ? `${learnedWords.length} / ${stationWords.length} learned so far`
      : "Opens now · 10 words a unit",
  };

  // --- Listening: one dialogue heard in every situation at this grade -----
  const completedDialogueAt = new Map(listeningRows.map((r) => [r.dialogue_id, r.completed_at]));
  const situations = SITUATIONS.map((s) => ({
    ...s,
    dialogues: DIALOGUES.filter((d) => d.level === grade && d.situationKey === s.key),
  })).filter((s) => s.dialogues.length > 0);
  const heardSituations = situations
    .map((s) => ({
      s,
      firstHeardAt: nthIso(
        s.dialogues.filter((d) => completedDialogueAt.has(d.id)).map((d) => completedDialogueAt.get(d.id)!),
        1,
      ),
    }))
    .filter((x) => x.firstHeardAt);
  const nextSituation = situations.find((s) => !s.dialogues.some((d) => completedDialogueAt.has(d.id)));
  const nextDialogue = nextSituation?.dialogues.find((d) => !completedDialogueAt.has(d.id));
  const listenMet = situations.length > 0 && heardSituations.length === situations.length;
  const listenStation: GuideStationProgress = {
    stationId: "listen",
    met: listenMet,
    detail: listenMet
      ? `${situations.length} situations`
      : `${heardSituations.length} / ${situations.length} situations heard`,
    doneAt: listenMet ? maxIso(heardSituations.map((x) => x.firstHeardAt!)) : undefined,
    percent: pct(heardSituations.length, situations.length),
    ctaHref:
      nextSituation && nextDialogue
        ? `/listening/${nextSituation.key}/${nextDialogue.id}`
        : `/listening?level=${grade}`,
    ctaLabel: nextSituation
      ? `${heardSituations.length ? "Continue" : "Start"}: ${nextSituation.label} →`
      : "Open Listening →",
    note:
      wordsLearnedAtGrade < LISTENING_EASIER_AFTER_WORDS
        ? `Opens now, easier after ${LISTENING_EASIER_AFTER_WORDS} words`
        : heardSituations.length
          ? `${heardSituations.length} / ${situations.length} situations so far`
          : `Opens now · ${situations.length} situations`,
  };

  // --- Pronunciation: clear the Warm-up tier ------------------------------
  const nailedIds = new Set(
    speakingRows.filter((r) => (r.best_score ?? 0) >= NAILED_THRESHOLD).map((r) => r.prompt_key),
  );
  const speakingAt = new Map(speakingRows.map((r) => [r.prompt_key, r.completed_at]));
  const warmup = orderedChapters().filter((c) => c.tier === 1);
  const clearedWarmup = warmup.filter((c) => c.items.every((w) => nailedIds.has(`${c.key}:${w.kr}`)));
  const nextChapter = warmup.find((c) => !clearedWarmup.includes(c));
  const pronMet = warmup.length > 0 && clearedWarmup.length === warmup.length;
  const pronStation: GuideStationProgress = {
    stationId: "pron",
    met: pronMet,
    detail: pronMet
      ? `${warmup.length} chapters · Warm-up`
      : `${clearedWarmup.length} / ${warmup.length} chapters cleared · Warm-up`,
    doneAt: pronMet
      ? maxIso(clearedWarmup.flatMap((c) => c.items.map((w) => speakingAt.get(`${c.key}:${w.kr}`) ?? "")).filter(Boolean))
      : undefined,
    percent: pct(clearedWarmup.length, warmup.length),
    ctaHref: nextChapter ? `/speaking?chapter=${nextChapter.key}` : "/speaking",
    ctaLabel: nextChapter
      ? `${clearedWarmup.length ? "Continue" : "Start"}: ${chapterBlurb(nextChapter.key)} →`
      : "Open Pronunciation →",
    note: clearedWarmup.length
      ? `${clearedWarmup.length} / ${warmup.length} chapters so far`
      : "Opens now · needs a mic",
  };

  // --- Reading: the first N passages of this grade ------------------------
  const passages = getPassagesForLevel(grade);
  const readAt = new Map(readingRows.map((r) => [r.passage_key, r.created_at]));
  const readPassages = passages.filter((p) => readAt.has(p.key));
  const readingTarget = Math.min(READING_STATION_PASSAGES, passages.length);
  const nextPassageIdx = passages.findIndex((p) => !readAt.has(p.key));
  const readMet = readingTarget > 0 && readPassages.length >= readingTarget;
  const readStation: GuideStationProgress = {
    stationId: "read",
    met: readMet,
    detail: readMet ? `${readingTarget} passages` : `${readPassages.length} / ${readingTarget} passages read`,
    doneAt: readMet ? nthIso(readPassages.map((p) => readAt.get(p.key)!), readingTarget) : undefined,
    percent: pct(readPassages.length, readingTarget),
    ctaHref:
      nextPassageIdx >= 0 ? `/reading/session?chapter=${nextPassageIdx}&level=${grade}` : `/reading?level=${grade}`,
    ctaLabel:
      nextPassageIdx >= 0
        ? `${readPassages.length ? "Continue" : "Start"}: Chapter ${nextPassageIdx + 1} →`
        : "Open Reading →",
    note: readPassages.length
      ? `${readPassages.length} / ${readingTarget} passages so far`
      : "Opens now · 4 min a passage",
  };

  // --- Writing: the first N pages of this grade ---------------------------
  const prompts = getPromptsForLevel(grade);
  const wroteAt = new Map(writingRows.map((r) => [r.prompt_key, r.completed_at]));
  const writtenPrompts = prompts.filter((p) => wroteAt.has(p.key));
  const writingTarget = Math.min(WRITING_STATION_PROMPTS, prompts.length);
  const nextPromptIdx = prompts.findIndex((p) => !wroteAt.has(p.key));
  const nextChapterIdx = nextPromptIdx >= 0 ? Math.floor(nextPromptIdx / CHAPTER_SIZE) : -1;
  const writeMet = writingTarget > 0 && writtenPrompts.length >= writingTarget;
  const writeStation: GuideStationProgress = {
    stationId: "write",
    met: writeMet,
    detail: writeMet ? `${writingTarget} pages` : `${writtenPrompts.length} / ${writingTarget} pages written`,
    doneAt: writeMet ? nthIso(writtenPrompts.map((p) => wroteAt.get(p.key)!), writingTarget) : undefined,
    percent: pct(writtenPrompts.length, writingTarget),
    ctaHref:
      nextChapterIdx >= 0 ? `/writing/session?chapter=${nextChapterIdx}&level=${grade}` : `/writing?level=${grade}`,
    ctaLabel:
      nextChapterIdx >= 0
        ? `${writtenPrompts.length ? "Continue" : "Start"}: Chapter ${nextChapterIdx + 1} →`
        : "Open Writing →",
    note: writtenPrompts.length
      ? `${writtenPrompts.length} / ${writingTarget} pages so far`
      : "Opens now · one page a day",
  };

  // --- Slang: one daily quiz taken ----------------------------------------
  const quizzes = slangRows.length;
  const slangStation: GuideStationProgress = {
    stationId: "slang",
    met: quizzes > 0,
    detail: quizzes > 0 ? `${quizzes} daily ${quizzes === 1 ? "quiz" : "quizzes"}` : "Today's quiz · 5 questions",
    doneAt: quizzes > 0 ? nthIso(slangRows.map((r) => r.created_at), 1) : undefined,
    percent: quizzes > 0 ? 100 : 0,
    ctaHref: "/slang",
    ctaLabel: "Take today's quiz →",
    note: "Opens now · one quiz a day",
  };

  return {
    grade,
    stations: {
      hangul,
      grammar: grammarStation,
      vocab: vocabStation,
      listen: listenStation,
      pron: pronStation,
      write: writeStation,
      read: readStation,
      slang: slangStation,
    },
    eligibility,
  };
}

/**
 * Apply the "first unmet station is where you are" rule to one roadmap.
 * Stations before it read as done, the rest as upcoming — a later station
 * that already happens to be met keeps an "Already done" note instead.
 */
export function resolveRoute(stationIds: GuideStationKey[], progress: GuideProgress): GuideStationView[] {
  let reachedCurrent = false;
  return stationIds.map((id) => {
    const p = progress.stations[id];
    let status: GuideStationStatus;
    if (!reachedCurrent && p.met) status = "done";
    else if (!reachedCurrent) {
      status = "current";
      reachedCurrent = true;
    } else status = "upcoming";
    return {
      ...p,
      status,
      note: status === "upcoming" && p.met ? `Already done · ${p.detail}` : p.note,
    };
  });
}

/** "Aug 24" — for the "Done Aug 24 · 40 letters" line. */
export function formatDoneDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
