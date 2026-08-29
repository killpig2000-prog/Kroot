"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSaveResume } from "@/hooks/useSaveResume";
import { clearResume } from "@/lib/resume";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { MINUTES_PER_PROMPT, MIN_RESPONSE_LENGTH, type Prompt } from "@/lib/writing";
import type { CefrLevel } from "@/lib/tree";
import WritePhase from "@/components/writing/WritePhase";
import GradingPhase from "@/components/writing/GradingPhase";
import CompareResult from "@/components/writing/CompareResult";

type Phase = "write" | "grading" | "compare";

type GradeResult = {
  score: number;
  feedback_en: string;
  corrected_kr: string;
  /** Plus only: sentence-by-sentence corrections. */
  corrections?: { original: string; corrected: string; note: string }[];
};

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";
const BTN_INK =
  "rounded-[9px] px-[18px] py-[9px] text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:bg-line disabled:text-faint";

export default function WritingSession({
  prompt,
  userId,
  level,
  chapterIndex,
  hasNextChapter,
  plus,
  species,
  costumeIds,
  treeStage,
}: {
  prompt: Prompt;
  userId: string;
  level: CefrLevel;
  chapterIndex: number;
  hasNextChapter: boolean;
  plus: boolean;
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
    label: prompt.prompt_en.length > 60 ? prompt.prompt_en.slice(0, 57) + "…" : prompt.prompt_en,
    detail: `Writing · Chapter ${chapterIndex + 1} · ${level}`,
  });
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
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

  async function submit() {
    if (response.trim().length < MIN_RESPONSE_LENGTH) return;
    setSubmitting(true);
    setPhase("grading");

    // Grade first: a free user who already wrote a different chapter today
    // gets daily_limit back, and the chapter must NOT be marked complete.
    let dailyLimited = false;
    try {
      const res = await fetch("/api/writing/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt_kr: prompt.prompt_kr,
          prompt_en: prompt.prompt_en,
          prompt_key: prompt.key,
          response_text: response.trim(),
          level,
          stimulus_kr: prompt.stimulus_kr,
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
      await supabase.from("writing_progress").upsert(
        {
          user_id: userId,
          prompt_key: prompt.key,
          response_text: response.trim(),
          completed_at: new Date().toISOString(),
        },
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

    const result = await recordCompletion(supabase, "writing", MINUTES_PER_PROMPT);
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
        prompt={prompt}
        chapterIndex={chapterIndex}
        response={response}
        setResponse={setResponse}
        showHint={showHint}
        setShowHint={setShowHint}
        submitting={submitting}
        ready={response.trim().length >= MIN_RESPONSE_LENGTH}
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
        response={response}
      />
    );
  }

  return (
    <CompareResult
      prompt={prompt}
      response={response}
      grade={grade}
      limitMessage={limitMessage}
      levelUp={levelUp}
      level={level}
      treeStage={treeStage ?? level}
      species={species}
      costumeIds={costumeIds}
      chapterIndex={chapterIndex}
      hasNextChapter={hasNextChapter}
      plus={plus}
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
