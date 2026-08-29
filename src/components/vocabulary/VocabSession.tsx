"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buttonClassName } from "@/components/ui/Button";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { nextBox, nextReviewAt } from "@/lib/srs";
import { prefetchKorean } from "@/lib/tts";
import {
  MINUTES_PER_SESSION,
  buildQuizQuestions,
  type QuizQuestion,
  type VocabWordWithProgress,
} from "@/lib/vocabulary";
import FlipPhase from "@/components/vocabulary/FlipPhase";
import QuizIntroPhase from "@/components/vocabulary/QuizIntroPhase";
import VocabQuizPhase from "@/components/vocabulary/VocabQuizPhase";
import VocabSummaryPhase from "@/components/vocabulary/VocabSummaryPhase";

const QUIZ_BONUS_MINUTES = 3;

type Phase = "flip" | "quizIntro" | "quiz" | "summary";
type Counts = { correct: number; incorrect: number };

const BTN_INK = buttonClassName("ink");
const CARD = "max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]";

export default function VocabSession({
  words,
  userId,
  topicLabel,
  topicKey,
  chapterIndex,
  hasNextChapter,
}: {
  words: VocabWordWithProgress[];
  userId: string;
  topicLabel: string;
  topicKey: string;
  chapterIndex: number;
  hasNextChapter: boolean;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [phase, setPhase] = useState<Phase>("flip");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [tricky, setTricky] = useState(0);
  const [navigating, setNavigating] = useState(false);

  // A refresh mid-session shouldn't restart the chapter — restore the flip-pass
  // position from sessionStorage. Restored in an effect (not the initializer)
  // so server and client render the same first frame.
  const resumeKey = `kroot-vocab-${topicKey}-${chapterIndex}-${words[0]?.level ?? ""}`;
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const raw = sessionStorage.getItem(resumeKey);
        if (!raw) return;
        const saved = JSON.parse(raw) as { index: number; known: number; tricky: number; phase: Phase };
        if (saved.phase === "quizIntro" || (saved.phase === "flip" && saved.index > 0 && saved.index < words.length)) {
          setIndex(Math.min(saved.index, words.length - 1));
          setKnown(saved.known);
          setTricky(saved.tricky);
          setPhase(saved.phase === "quizIntro" ? "quizIntro" : "flip");
        }
      } catch {
        // Corrupt or unavailable storage — just start fresh.
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveResume(next: { index: number; known: number; tricky: number; phase: Phase }) {
    try {
      sessionStorage.setItem(resumeKey, JSON.stringify(next));
    } catch {}
  }

  function clearResume() {
    try {
      sessionStorage.removeItem(resumeKey);
    } catch {}
  }

  // Local source of truth for each word's counts, seeded from props and kept
  // current across both the flip pass and the quiz pass on the same words.
  const [counts, setCounts] = useState<Record<string, Counts>>(() =>
    Object.fromEntries(words.map((w) => [w.key, { correct: w.correct_count, incorrect: w.incorrect_count }]))
  );
  // Leitner boxes for spaced repetition; answering twice in one session
  // (flip + quiz) legitimately moves a word two boxes.
  const [boxes, setBoxes] = useState<Record<string, number>>(() =>
    Object.fromEntries(words.map((w) => [w.key, w.box ?? 1]))
  );

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizKnown, setQuizKnown] = useState(0);
  const [quizTricky, setQuizTricky] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [tookQuiz, setTookQuiz] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [rootOpen, setRootOpen] = useState(false);
  const loggedMinutes = useRef(false);

  const word = words[index];

  // Warm the next few cards' audio so the speaker button plays instantly.
  useEffect(() => {
    prefetchKorean(
      words.slice(index, index + 3).flatMap((w) => [
        w.korean,
        w.example_kr,
        ...(w.moreExamples ?? []).map((e) => e.kr),
      ].filter(Boolean))
    );
  }, [index, words]);

  async function saveProgress(wordKey: string, gotIt: boolean) {
    const prev = counts[wordKey] ?? { correct: 0, incorrect: 0 };
    const next: Counts = {
      correct: prev.correct + (gotIt ? 1 : 0),
      incorrect: prev.incorrect + (gotIt ? 0 : 1),
    };
    setCounts((c) => ({ ...c, [wordKey]: next }));

    const box = nextBox(boxes[wordKey] ?? 1, gotIt);
    setBoxes((b) => ({ ...b, [wordKey]: box }));

    const { error } = await supabase.from("vocabulary_progress").upsert(
      {
        user_id: userId,
        word_key: wordKey,
        correct_count: next.correct,
        incorrect_count: next.incorrect,
        last_reviewed_at: new Date().toISOString(),
        box,
        next_review_at: nextReviewAt(box),
      },
      { onConflict: "user_id,word_key" }
    );
    // Before migration 0022 the box columns don't exist — keep counts working.
    if (error) {
      await supabase.from("vocabulary_progress").upsert(
        {
          user_id: userId,
          word_key: wordKey,
          correct_count: next.correct,
          incorrect_count: next.incorrect,
          last_reviewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,word_key" }
      );
    }
  }

  async function answerFlip(gotIt: boolean) {
    await saveProgress(word.key, gotIt);
    const nextKnown = known + (gotIt ? 1 : 0);
    const nextTricky = tricky + (gotIt ? 0 : 1);
    if (gotIt) setKnown(nextKnown);
    else setTricky(nextTricky);

    setFlipped(false);
    setRootOpen(false);
    if (index + 1 < words.length) {
      setIndex((i) => i + 1);
      saveResume({ index: index + 1, known: nextKnown, tricky: nextTricky, phase: "flip" });
    } else {
      setPhase("quizIntro");
      saveResume({ index, known: nextKnown, tricky: nextTricky, phase: "quizIntro" });
    }
  }

  function startQuiz() {
    setQuizQuestions(buildQuizQuestions(words));
    setQuizIndex(0);
    setQuizKnown(0);
    setQuizTricky(0);
    setTookQuiz(true);
    setPhase("quiz");
  }

  async function answerQuiz(option: string) {
    if (selected) return;
    setSelected(option);
    const q = quizQuestions[quizIndex];
    const gotIt = option === (q.mode === "meaning" ? q.word.meaning_en : q.word.korean);
    await saveProgress(q.word.key, gotIt);
    if (gotIt) setQuizKnown((k) => k + 1);
    else setQuizTricky((t) => t + 1);

    setTimeout(() => {
      setSelected(null);
      if (quizIndex + 1 < quizQuestions.length) {
        setQuizIndex((i) => i + 1);
      } else {
        setPhase("summary");
        void logMinutesOnce();
      }
    }, 700);
  }

  async function logMinutesOnce() {
    if (loggedMinutes.current) return;
    loggedMinutes.current = true;
    clearResume();

    const minutes = MINUTES_PER_SESSION + (tookQuiz ? QUIZ_BONUS_MINUTES : 0);
    const result = await recordCompletion(supabase, "vocabulary", minutes);
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logMinutesOnce();
    router.push(href);
    router.refresh();
  }

  if (words.length === 0) {
    return (
      <div className={`${CARD} text-center`}>
        <p className="font-bold text-[17px] tracking-[-0.01em] mb-1.5">No words here yet</p>
        <p className="text-sm text-muted mb-5">This chapter doesn&apos;t have cards yet — try another one.</p>
        <Link href="/vocabulary" className={BTN_INK}>
          Back to topics
        </Link>
      </div>
    );
  }

  if (phase === "quizIntro") {
    return (
      <QuizIntroPhase
        known={known}
        total={words.length}
        onStartQuiz={startQuiz}
        onSkipQuiz={() => {
          setPhase("summary");
          void logMinutesOnce();
        }}
      />
    );
  }

  if (phase === "quiz") {
    return (
      <VocabQuizPhase
        quizQuestions={quizQuestions}
        quizIndex={quizIndex}
        quizKnown={quizKnown}
        selected={selected}
        onAnswer={answerQuiz}
      />
    );
  }

  if (phase === "summary") {
    return (
      <VocabSummaryPhase
        words={words}
        known={known}
        tricky={tricky}
        tookQuiz={tookQuiz}
        quizKnown={quizKnown}
        quizTricky={quizTricky}
        levelUp={levelUp}
        hasNextChapter={hasNextChapter}
        topicKey={topicKey}
        chapterIndex={chapterIndex}
        navigating={navigating}
        onGoTo={goTo}
      />
    );
  }

  return (
    <FlipPhase
      words={words}
      index={index}
      word={word}
      wordCounts={counts[word.key] ?? { correct: 0, incorrect: 0 }}
      topicLabel={topicLabel}
      flipped={flipped}
      rootOpen={rootOpen}
      onFlip={() => setFlipped(true)}
      onAnswer={answerFlip}
      onOpenRoot={() => setRootOpen(true)}
      onCloseRoot={() => setRootOpen(false)}
    />
  );
}
