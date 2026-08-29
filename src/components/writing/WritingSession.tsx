"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSaveResume } from "@/hooks/useSaveResume";
import { clearResume } from "@/lib/resume";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { MINUTES_PER_CHAPTER, MIN_RESPONSE_LENGTH, type Prompt } from "@/lib/writing";
import type { ChapterGradeResult } from "@/app/api/writing/grade/route";
import type { CefrLevel } from "@/lib/tree";
import WritePhase from "@/components/writing/WritePhase";
import GradingPhase from "@/components/writing/GradingPhase";
import CompareResult from "@/components/writing/CompareResult";

type Phase = "write" | "grading" | "compare";

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";
const BTN_INK =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";

export default function WritingSession({
  prompts,
  userId,
  level,
  chapterIndex,
  hasNextChapter,
  species,
  costumeIds,
  treeStage,
}: {
  prompts: Prompt[];
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
  const [responses, setResponses] = useState<string[]>(() => prompts.map(() => ""));
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [grade, setGrade] = useState<ChapterGradeResult | null>(null);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [gradingStep, setGradingStep] = useState(0);
  const loggedMinutes = useRef(false);

  // Reset the grading-step cycle whenever we leave "grading" — computed
  // during render (not an effect) so it doesn't trigger an extra render.
  const [gradingStepPhase, setGradingStepPhase] = useState(phase);
  if (phase !== gradingStepPhase) {
    setGradingStepPhase(phase);
    if (phase !== "grading") setGradingStep(0);
  }

  // Grading is a real API round-trip (often 5-15s) — cycle through a few
  // reassuring lines instead of one static caption so a slow check doesn't
  // read as stuck.
  useEffect(() => {
    if (phase !== "grading") return;
    const id = setInterval(() => setGradingStep((s) => s + 1), 3200);
    return () => clearInterval(id);
  }, [phase]);

  function setResponse(index: number, value: string) {
    setResponses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  const answeredCount = responses.filter((r) => r.trim().length >= MIN_RESPONSE_LENGTH).length;
  const ready = answeredCount === prompts.length;

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    setPhase("grading");

    let dailyLimited = false;
    try {
      const res = await fetch("/api/writing/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          answers: prompts.map((p, i) => ({
            prompt_kr: p.prompt_kr,
            prompt_en: p.prompt_en,
            stimulus_kr: p.stimulus_kr,
            response_text: responses[i].trim(),
          })),
        }),
      });
      if (res.ok) {
        setGrade(await res.json());
      } else if (res.status === 429) {
        const body = await res.json().catch(() => null);
        if (body?.error === "daily_limit") {
          dailyLimited = true;
          setLimitMessage(body.message);
        }
      }
    } catch {
      // grading is best-effort — fall through to the compare screen without it
    }

    if (dailyLimited) {
      // Nothing was completed — don't let the nav buttons award minutes/XP.
      loggedMinutes.current = true;
    } else {
      const completedAt = new Date().toISOString();
      await supabase.from("writing_progress").upsert(
        prompts.map((p, i) => ({
          user_id: userId,
          prompt_key: p.key,
          response_text: responses[i].trim(),
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
        responses={responses}
        setResponse={setResponse}
        submitting={submitting}
        ready={ready}
        answeredCount={answeredCount}
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
