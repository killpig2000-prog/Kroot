"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSaveResume } from "@/hooks/useSaveResume";
import { clearResume } from "@/lib/resume";
import { buttonClassName } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { findEvidenceLine, MINUTES_PER_PASSAGE, splitPassageLines, type Passage } from "@/lib/reading";
import ReadPhase from "@/components/reading/ReadPhase";
import QuizPhase from "@/components/reading/QuizPhase";
import SummaryPhase from "@/components/reading/SummaryPhase";
import type { Gloss } from "@/lib/word-links";

type Phase = "read" | "quiz" | "summary";

const BTN_INK = buttonClassName("ink");

export default function ReadingSession({
  passage,
  userId,
  chapterIndex,
  hasNextChapter,
  level,
  glossary,
  words,
}: {
  passage: Passage;
  userId: string;
  chapterIndex: number;
  hasNextChapter: boolean;
  level: string;
  /** Surface form → vocabulary entry, resolved on the server. */
  glossary: Record<string, Gloss>;
  words: Gloss[];
}) {
  const t = useTranslations("reading");
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const lines = useMemo(() => splitPassageLines(passage), [passage]);
  // Which line answers each question — computed once, from the English text.
  const evidence = useMemo(
    () => passage.questions.map((q) => findEvidenceLine(lines, q)),
    [lines, passage.questions]
  );

  const [phase, setPhase] = useState<Phase>("read");
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() =>
    passage.questions.map(() => null)
  );
  // Mirror of `answers` that's safe to read from the click handler that
  // finishes the last question, before its state update has rendered.
  const answersRef = useRef<(boolean | null)[]>(passage.questions.map(() => null));
  const [navigating, setNavigating] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const loggedMinutes = useRef(false);

  const correct = answers.filter((a) => a === true).length;
  const incorrect = answers.filter((a) => a === false).length;
  const missed = answers.flatMap((a, i) => (a === false ? [i] : []));

  useSaveResume(phase === "summary" ? null : userId, {
    skill: "reading",
    href: "",
    label: passage.title_kr,
    detail: t("session.resumeDetail", { n: chapterIndex + 1, level }),
    progress:
      phase === "read" ? 0 : Math.round((qIndex / Math.max(1, passage.questions.length)) * 100),
  });

  function answer(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    const gotIt = optionIndex === passage.questions[qIndex].answerIndex;
    const next = [...answersRef.current];
    next[qIndex] = gotIt;
    answersRef.current = next;
    setAnswers(next);
  }

  // The reader advances, not a timer — a wrong answer is worth reading about.
  function nextQuestion() {
    if (selected === null) return;
    setSelected(null);
    if (qIndex + 1 < passage.questions.length) {
      setQIndex((i) => i + 1);
      return;
    }
    setPhase("summary");
    // Save right away so the level-up line can show on the summary screen.
    void logProgressOnce();
  }

  async function logProgressOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;
    void clearResume(supabase, userId);

    const final = answersRef.current;

    await supabase.from("reading_progress").upsert(
      {
        user_id: userId,
        passage_key: passage.key,
        correct_count: final.filter((a) => a === true).length,
        incorrect_count: final.filter((a) => a === false).length,
        last_reviewed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,passage_key" }
    );

    const result = await recordCompletion(supabase, "reading", MINUTES_PER_PASSAGE);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    // Logging progress must never block the way out. When this RPC failed
    // (offline, a blip) the await rejected, router.push never ran, and the
    // learner was left tapping a dead "continue" button at the end of a
    // finished session with no way forward but a reload.
    try {
      await logProgressOnce();
    } catch {
      // best effort — the session is over either way
    }
    router.push(href);
    router.refresh();
  }

  if (phase === "read") {
    return (
      <ReadPhase
        passage={passage}
        chapterIndex={chapterIndex}
        level={level}
        lines={lines}
        glossary={glossary}
        words={words}
        // Coming back from the summary for a second read returns there, not
        // into a quiz that's already been answered.
        onContinue={() => setPhase(answers.every((a) => a !== null) ? "summary" : "quiz")}
      />
    );
  }

  if (phase === "quiz") {
    return (
      <QuizPhase
        passage={passage}
        lines={lines}
        glossary={glossary}
        qIndex={qIndex}
        answers={answers}
        selected={selected}
        evidenceIndex={evidence[qIndex]}
        onAnswer={answer}
        onNext={nextQuestion}
      />
    );
  }

  return (
    <SummaryPhase
      passage={passage}
      chapterIndex={chapterIndex}
      correct={correct}
      incorrect={incorrect}
      missed={missed}
      words={words}
      levelUp={levelUp}
      hasNextChapter={hasNextChapter}
      level={level}
      navigating={navigating}
      onGoTo={goTo}
      // Re-reading keeps the answers — it's a second look at the story, not a
      // second attempt at the quiz.
      onReRead={() => setPhase("read")}
    />
  );
}

export function ReadingEmpty() {
  const t = useTranslations("reading.session");
  return (
    <div className="max-w-[680px] border border-line rounded-[14px] px-7 py-10 text-center">
      <p className="font-bold text-[17px] tracking-[-0.01em] mb-1.5">{t("emptyTitle")}</p>
      <p className="text-sm text-muted mb-5">{t("emptyBody")}</p>
      <Link href="/reading" className={BTN_INK}>
        {t("backToMap")}
      </Link>
    </div>
  );
}
