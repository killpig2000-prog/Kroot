"use client";

import { useMemo, useRef, useState } from "react";
import { useSaveResume } from "@/hooks/useSaveResume";
import { clearResume } from "@/lib/resume";
import { buttonClassName } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { Link, redirect, useRouter, usePathname, getPathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { MINUTES_PER_PASSAGE, type Passage } from "@/lib/reading";
import ReadPhase from "@/components/reading/ReadPhase";
import QuizPhase from "@/components/reading/QuizPhase";
import SummaryPhase from "@/components/reading/SummaryPhase";

type Phase = "read" | "quiz" | "summary";

const BTN_INK = buttonClassName("ink");

export default function ReadingSession({
  passage,
  userId,
  chapterIndex,
  hasNextChapter,
  level,
}: {
  passage: Passage;
  userId: string;
  chapterIndex: number;
  hasNextChapter: boolean;
  level: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("read");
  const [showTranslation, setShowTranslation] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const loggedMinutes = useRef(false);
  // Mirrors of correct/incorrect that are safe to read inside timeouts.
  const counts = useRef({ correct: 0, incorrect: 0 });

  useSaveResume(
    phase === "summary" ? null : userId,
    { skill: "reading", href: "", label: passage.title_kr, detail: `Reading · Chapter ${chapterIndex + 1} · ${level}`, progress: phase === "read" ? 0 : Math.round((qIndex / Math.max(1, passage.questions.length)) * 100) }
  );

  const question = passage.questions[qIndex];

  async function answer(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    const gotIt = optionIndex === question.answerIndex;
    if (gotIt) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    if (gotIt) counts.current.correct += 1;
    else counts.current.incorrect += 1;

    setTimeout(() => {
      setSelected(null);
      if (qIndex + 1 < passage.questions.length) {
        setQIndex((i) => i + 1);
      } else {
        setPhase("summary");
        // Save right away so the level-up line can show on the summary screen.
        void logProgressOnce();
      }
    }, 700);
  }

  async function logProgressOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;
    void clearResume(supabase, userId);

    await supabase.from("reading_progress").upsert(
      {
        user_id: userId,
        passage_key: passage.key,
        correct_count: counts.current.correct,
        incorrect_count: counts.current.incorrect,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,passage_key" }
    );

    const result = await recordCompletion(supabase, "reading", MINUTES_PER_PASSAGE);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logProgressOnce();
    router.push(href);
    router.refresh();
  }

  if (phase === "read") {
    return (
      <ReadPhase
        passage={passage}
        chapterIndex={chapterIndex}
        showTranslation={showTranslation}
        onToggleTranslation={() => setShowTranslation((s) => !s)}
        onContinue={() => setPhase("quiz")}
        userId={userId}
      />
    );
  }

  if (phase === "quiz") {
    return (
      <QuizPhase passage={passage} qIndex={qIndex} correct={correct} selected={selected} onAnswer={answer} />
    );
  }

  return (
    <SummaryPhase
      passage={passage}
      chapterIndex={chapterIndex}
      correct={correct}
      incorrect={incorrect}
      levelUp={levelUp}
      hasNextChapter={hasNextChapter}
      level={level}
      navigating={navigating}
      onGoTo={goTo}
    />
  );
}

export function ReadingEmpty() {
  return (
    <div className="max-w-[680px] border border-line rounded-[14px] px-7 py-10 text-center">
      <p className="font-bold text-[17px] tracking-[-0.01em] mb-1.5">No story here yet</p>
      <p className="text-sm text-muted mb-5">This chapter isn&apos;t written yet.</p>
      <Link href="/reading" className={BTN_INK}>
        Back to the map
      </Link>
    </div>
  );
}
