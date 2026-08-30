"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSaveResume } from "@/hooks/useSaveResume";
import { clearResume } from "@/lib/resume";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { track } from "@/lib/analytics";
import { MINUTES_PER_CHAPTER, type Prompt } from "@/lib/writing";
import {
  buildBoard,
  checkSlots,
  checkTiles,
  chunksText,
  defaultMode,
  isLocalMode,
  localScore,
  slotsText,
  tilesText,
  type Board,
} from "@/lib/writing-builder";
import type { ChapterGradeResult } from "@/app/api/writing/grade/route";
import type { CefrLevel } from "@/lib/tree";
import WritePhase, { emptyEntry, entryDone, type Entry } from "@/components/writing/WritePhase";
import GradingPhase from "@/components/writing/GradingPhase";
import CompareResult from "@/components/writing/CompareResult";

type Phase = "write" | "grading" | "compare";

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";
const BTN_INK =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";

/** Learner prefers the keyboard everywhere — remembered per device. */
const TYPING_PREF_KEY = "kroot-writing-typing";

function readTypingPref(): boolean {
  try {
    return localStorage.getItem(TYPING_PREF_KEY) === "1";
  } catch {
    return false;
  }
}
const noopSubscribe = () => () => {};
/** localStorage-backed, false on the server so the first render matches. */
function useTypingPref(): boolean {
  return useSyncExternalStore(noopSubscribe, readTypingPref, () => false);
}
function writeTypingPref(on: boolean) {
  try {
    if (on) localStorage.setItem(TYPING_PREF_KEY, "1");
    else localStorage.removeItem(TYPING_PREF_KEY);
  } catch {
    // private mode — the choice just doesn't persist
  }
}

/** The answer text a board currently spells, for saving and grading. */
function responseText(entry: Entry, board: Board): string {
  switch (board.mode) {
    case "tiles":
      return tilesText(board, entry.picked);
    case "slots":
      return slotsText(board, entry.chosen);
    case "chunks":
      return chunksText(board, entry.picked);
    default:
      return entry.text.trim();
  }
}

export default function WritingSession({
  prompts,
  siblings = [],
  userId,
  level,
  chapterIndex,
  hasNextChapter,
  species,
  costumeIds,
  treeStage,
}: {
  prompts: Prompt[];
  /** Same level + genre, outside this chapter — distractor pool for the boards. */
  siblings?: Prompt[];
  userId: string;
  level: CefrLevel;
  chapterIndex: number;
  hasNextChapter: boolean;
  /** The learner's actual CEFR grade — keeps the tree's species matching their real garden. */
  species?: CefrLevel;
  costumeIds?: string[];
  /** The learner's real growth-stage silhouette (from their Lv, like the dashboard tree) — falls back to `level` if omitted. */
  treeStage?: CefrLevel;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("write");
  useSaveResume(phase === "write" ? userId : null, {
    skill: "writing",
    href: "",
    label: `Chapter ${chapterIndex + 1}`,
    detail: `Writing · Chapter ${chapterIndex + 1} · ${level}`,
  });

  // Boards are deterministic per (prompt, attempt), so the server and the
  // first client render agree. A remembered "type it myself" preference
  // (client-only) overrides the level's default until a question is toggled.
  const typingPref = useTypingPref();
  const [entries, setEntries] = useState<Entry[]>(() =>
    prompts.map((p, i) => emptyEntry(defaultMode(level, i, prompts.length)))
  );
  const modes = useMemo(
    () => entries.map((e) => (e.explicit || !typingPref ? e.mode : "type")),
    [entries, typingPref]
  );

  const pool = useMemo(() => [...prompts, ...siblings], [prompts, siblings]);
  const boards = useMemo<Board[]>(
    () => prompts.map((p, i) => buildBoard(modes[i], p, pool, entries[i].attempt)),
    [prompts, pool, entries, modes]
  );

  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [grade, setGrade] = useState<ChapterGradeResult | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [gradingStep, setGradingStep] = useState(0);
  const loggedMinutes = useRef(false);

  const [gradingStepPhase, setGradingStepPhase] = useState(phase);
  if (phase !== gradingStepPhase) {
    setGradingStepPhase(phase);
    if (phase !== "grading") setGradingStep(0);
  }

  useEffect(() => {
    if (phase !== "grading") return;
    const id = setInterval(() => setGradingStep((s) => s + 1), 3200);
    return () => clearInterval(id);
  }, [phase]);

  function update(index: number, patch: Partial<Entry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  function check(index: number) {
    const board = boards[index];
    const entry = entries[index];
    let ok = false;
    if (board.mode === "tiles") ok = checkTiles(board, entry.picked);
    else if (board.mode === "slots") ok = checkSlots(board, entry.chosen).every(Boolean);
    else return;
    const checks = entry.checks + 1;
    update(index, { checked: ok, checks });
    track("activity_completed", { kind: "writing_check", mode: board.mode, right: ok, checks });
  }

  function shuffle(index: number) {
    update(index, { attempt: entries[index].attempt + 1, picked: [], chosen: [], activeSlot: 0, checked: null });
  }

  function toggleMode(index: number) {
    const entry = entries[index];
    const typing = modes[index] !== "type";
    const mode = typing ? "type" : defaultMode(level, index, prompts.length);
    // The keyboard is a preference; blocks are the default — only remember opting in.
    writeTypingPref(typing && modes.every((m, i) => i === index || m === "type"));
    update(index, { ...emptyEntry(mode), explicit: true, attempt: entry.attempt + 1 });
  }

  const responses = useMemo(() => entries.map((e, i) => responseText(e, boards[i])), [entries, boards]);
  const answeredCount = entries.filter((e, i) => entryDone(e, boards[i])).length;
  const ready = answeredCount === prompts.length;
  const graderIdx = entries.map((e, i) => (isLocalMode(boards[i].mode) ? -1 : i)).filter((i) => i >= 0);
  const needsGrader = graderIdx.length > 0;

  /** Marks for the locally-checked boards — merged with (or standing in for) the AI's. */
  function localAnswer(i: number): ChapterGradeResult["answers"][number] {
    const e = entries[i];
    const text = responses[i];
    return {
      index: i,
      score: localScore(e.checks),
      original: text,
      corrected: text,
      note:
        e.checks <= 1
          ? "Built correctly on the first try."
          : `Right after ${e.checks} tries — say it aloud once more to lock it in.`,
    };
  }

  function mergeGrade(ai: ChapterGradeResult | null): ChapterGradeResult {
    const answers = prompts.map((_, i) => {
      if (isLocalMode(boards[i].mode)) return localAnswer(i);
      const k = graderIdx.indexOf(i);
      const a = ai?.answers.find((x) => x.index === k) ?? ai?.answers[k];
      return a
        ? { ...a, index: i }
        : { index: i, score: 0, original: responses[i], corrected: responses[i], note: "Grading wasn't available for this one." };
    });
    const score = Math.round(answers.reduce((s, a) => s + a.score, 0) / Math.max(1, answers.length));
    const retries = entries.filter((e, i) => isLocalMode(boards[i].mode) && e.checks > 1).length;
    return {
      score,
      feedback_en:
        ai?.feedback_en ??
        (retries === 0
          ? "Every sentence came together on the first try — your word order is solid."
          : `You got there — ${retries} of them took a second look, which is exactly how the order sinks in.`),
      answers,
      commonPatterns: ai?.commonPatterns ?? [],
      learningPoint: ai?.learningPoint ?? {
        headline:
          retries === 0
            ? "Next chapter loosens the blocks a little — try building each sentence before you look at the English."
            : "Before you tap, say the whole sentence in Korean — then place the blocks to match.",
        example_kr: prompts[0]?.example_kr,
      },
    };
  }

  async function submit() {
    if (!ready) return;
    setSubmitting(true);

    // One row per chapter, not per question — cheap, and gives admin the
    // tiles/slots/chunks/typed adoption split and the local-vs-Gemini ratio.
    const modeCounts = { tiles: 0, slots: 0, chunks: 0, type: 0 };
    for (const b of boards) modeCounts[b.mode]++;
    track("writing_chapter_submitted", {
      level,
      ...modeCounts,
      graded_locally: !needsGrader,
      retries: entries.reduce((s, e, i) => s + (isLocalMode(boards[i].mode) ? Math.max(0, e.checks - 1) : 0), 0),
    });

    let dailyLimited = false;
    let ai: ChapterGradeResult | null = null;

    if (needsGrader) {
      setPhase("grading");
      try {
        const res = await fetch("/api/writing/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            level,
            answers: graderIdx.map((i) => ({
              prompt_kr: prompts[i].prompt_kr,
              prompt_en: prompts[i].prompt_en,
              stimulus_kr: prompts[i].stimulus_kr,
              response_text: responses[i],
            })),
          }),
        });
        if (res.ok) {
          ai = await res.json();
        } else if (res.status === 429) {
          const body = await res.json().catch(() => null);
          if (body?.error === "daily_limit") {
            dailyLimited = true;
            setLimitMessage(body.message);
          }
        }
      } catch {
        // grading is best-effort — the local marks still stand
      }
    }

    if (dailyLimited) {
      loggedMinutes.current = true;
    } else {
      // Only stand in for the AI when nothing needed it, or when it answered;
      // an unavailable grader for typed answers keeps the old "saved, not graded" card.
      if (!needsGrader || ai) setGrade(mergeGrade(ai));
      const completedAt = new Date().toISOString();
      await supabase.from("writing_progress").upsert(
        prompts.map((p, i) => ({
          user_id: userId,
          prompt_key: p.key,
          response_text: responses[i],
          completed_at: completedAt,
        })),
        { onConflict: "user_id,prompt_key" }
      );
      await logMinutesOnce();
    }

    setSubmitting(false);
    setPhase("compare");
  }

  async function logMinutesOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;
    void clearResume(supabase, userId);

    const result = await recordCompletion(supabase, "writing", MINUTES_PER_CHAPTER);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logMinutesOnce();
    router.push(href);
    router.refresh();
  }

  if (phase === "write") {
    return (
      <WritePhase
        prompts={prompts}
        chapterIndex={chapterIndex}
        entries={entries}
        boards={boards}
        update={update}
        onCheck={check}
        onShuffle={shuffle}
        onToggleMode={toggleMode}
        submitting={submitting}
        ready={ready}
        answeredCount={answeredCount}
        needsGrader={needsGrader}
        onSubmit={submit}
      />
    );
  }

  if (phase === "grading") {
    return (
      <GradingPhase
        gradingStep={gradingStep}
        treeStage={treeStage ?? level}
        species={species}
        costumeIds={costumeIds}
        responses={responses}
      />
    );
  }

  return (
    <CompareResult
      prompts={prompts}
      responses={responses}
      grade={grade}
      limitMessage={limitMessage}
      levelUp={levelUp}
      level={level}
      treeStage={treeStage ?? level}
      species={species}
      costumeIds={costumeIds}
      chapterIndex={chapterIndex}
      hasNextChapter={hasNextChapter}
      navigating={navigating}
      onGoTo={goTo}
    />
  );
}

export function WritingEmpty() {
  return (
    <div className={`${CARD} px-7 py-10 text-center`}>
      <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">No prompt here yet</h2>
      <p className="text-sm text-muted mb-6">This page hasn&apos;t been written yet.</p>
      <Link href="/writing" className={BTN_INK}>
        Back to all pages
      </Link>
    </div>
  );
}
