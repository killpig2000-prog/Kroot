"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, XP_POINTS, type ProgressResult } from "@/lib/activity";
import { nextBox, nextReviewAt, SRS_INTERVALS_DAYS } from "@/lib/srs";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import {
  buildQuizQuestions,
  seedFromWords,
  type QuizQuestion,
  type VocabWord,
  type VocabWordWithProgress,
} from "@/lib/vocabulary";

const REVIEW_MINUTES = 5;

const CARD = "max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]";
const COLOR = "#3E7C59";

export default function ReviewSession({
  words,
  pool,
  userId,
}: {
  words: VocabWordWithProgress[];
  /** Same-level words the quiz draws its wrong answers from. */
  pool?: VocabWord[];
  userId: string;
}) {
  const router = useRouter();
  const t = useTranslations("vocabulary.practice");
  const tu = useTranslations("ui");
  const supabase = useMemo(() => createClient(), []);

  // Seeded: this initializer runs during render on the server and again while
  // hydrating, so the two must agree on the option order.
  const [questions] = useState<QuizQuestion[]>(() =>
    buildQuizQuestions(words, seedFromWords(words), pool)
  );
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<VocabWordWithProgress[]>([]);
  const [done, setDone] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const boxes = useRef<Record<string, number>>(
    Object.fromEntries(words.map((w) => [w.key, w.box ?? 1]))
  );
  const logged = useRef(false);

  async function answer(option: string) {
    if (selected) return;
    setSelected(option);

    const q = questions[index];
    const gotIt = option === (q.mode === "meaning" ? q.word.meaning_en : q.word.korean);
    const word = words.find((w) => w.key === q.word.key);
    const box = nextBox(boxes.current[q.word.key] ?? 1, gotIt);
    boxes.current[q.word.key] = box;

    if (gotIt) setCorrect((c) => c + 1);
    else if (word) setMissed((m) => (m.some((w) => w.key === word.key) ? m : [...m, word]));

    // Interrupting the quiz over a failed write would be worse than finishing
    // it, but the learner still has to be told at the end — otherwise the
    // words come back undone with nothing to explain it.
    try {
      const { error } = await supabase.from("vocabulary_progress").upsert(
        {
          user_id: userId,
          word_key: q.word.key,
          correct_count: (word?.correct_count ?? 0) + (gotIt ? 1 : 0),
          incorrect_count: (word?.incorrect_count ?? 0) + (gotIt ? 0 : 1),
          last_reviewed_at: new Date().toISOString(),
          box,
          next_review_at: nextReviewAt(box),
        },
        { onConflict: "user_id,word_key" }
      );
      if (error) setSaveFailed(true);
    } catch {
      setSaveFailed(true);
    }

    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        setDone(true);
        void logOnce();
      }
    }, 700);
  }

  async function logOnce() {
    if (logged.current) return;
    logged.current = true;
    const result = await recordCompletion(supabase, "vocabulary", REVIEW_MINUTES);
    if (result?.leveled_up || result?.coins_earned) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    // Logging progress must never block the way out. When this RPC failed
    // (offline, a blip) the await rejected, router.push never ran, and the
    // learner was left tapping a dead "continue" button at the end of a
    // finished session with no way forward but a reload.
    try {
      await logOnce();
    } catch {
      // best effort — the session is over either way
    }
    router.push(href);
    router.refresh();
  }

  if (done) {
    const kept = correct;
    const slipped = missed.length;
    const movedUp = words.filter((w) => (boxes.current[w.key] ?? 1) > (w.box ?? 1)).length;
    const movedDown = words.filter((w) => (boxes.current[w.key] ?? 1) < (w.box ?? 1)).length;
    const dueBuckets = SRS_INTERVALS_DAYS.map((days, i) => ({
      days,
      count: words.filter((w) => (boxes.current[w.key] ?? 1) === i + 1).length,
    }));

    return (
      <ResultShell
        color={COLOR}
        categoryLabel="Review"
        ring={
          <ResultRing
            pct={questions.length ? (kept / questions.length) * 100 : 0}
            center={kept}
            unit={`/${questions.length}`}
            label={t("doneTitle")}
            color={COLOR}
          />
        }
        headline={t("doneTitle")}
        sub={
          <>
            {t("doneSub", { kept, total: questions.length })}
            {slipped > 0 && ` ${t("doneSlipped")}`}
          </>
        }
        tags={
          <>
            {movedUp > 0 && <ResultTag tone="good">↑ {movedUp} moved up</ResultTag>}
            {movedDown > 0 && <ResultTag tone="warn">↓ {movedDown} back to box 1</ResultTag>}
          </>
        }
        levelUp={levelUp}
        xpValue={XP_POINTS.vocabulary}
        xpLabel={tu("xpEarned", { skill: "Review" })}
        actions={
          <>
            <button
              className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60"
              onClick={() => goTo("/dashboard")}
              disabled={navigating}
            >
              {navigating ? tu("saving") : tu("backToGarden")}
            </button>
            <button
              className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-charcoal bg-cream border border-line hover:bg-warm transition-colors disabled:opacity-60"
              onClick={() => goTo("/review")}
              disabled={navigating}
            >
              {navigating ? tu("saving") : tu("moreToWater")}
            </button>
          </>
        }
      >
        {saveFailed && <p role="status" className="text-[13px] text-danger">{t("saveFailed")}</p>}

        {dueBuckets.some((b) => b.count > 0) && (
          <div>
            <b className="block text-[11.5px] font-bold tracking-[.06em] uppercase text-faint mb-2">Coming back</b>
            <div className="grid grid-cols-5 gap-2">
              {dueBuckets.map((b) => (
                <div
                  key={b.days}
                  className={`text-center rounded-[10px] border px-1.5 py-2 ${
                    b.count > 0 ? "border-success-line bg-success-bg" : "border-line bg-warm"
                  }`}
                >
                  <b className={`block text-[18px] font-bold tabular-nums ${b.count > 0 ? "text-success-deep" : "text-faint"}`}>
                    {b.count}
                  </b>
                  <small className="text-[10.5px] text-faint font-semibold">{b.days}d</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {slipped > 0 && (
          <div className="text-left border border-amber-line bg-[var(--tint-amber)] rounded-[10px] px-4 py-3">
            <b className="block text-[12.5px] font-semibold text-[#92400E] mb-1.5">{t("backInCan")}</b>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {missed.map((w) => (
                <span key={w.key} className="text-[13px]">
                  <span className="kr font-medium">{w.korean}</span>{" "}
                  <span className="text-[#A16207]">{w.meaning_en}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </ResultShell>
    );
  }

  const q = questions[index];
  if (!q) {
    return (
      <div className={`${CARD} text-center`}>
        <p className="font-bold text-[17px] mb-1.5">{t("nothingToReview")}</p>
        <Link href="/dashboard" className="text-sm font-semibold text-success hover:underline">
          {tu("backToGarden")}
        </Link>
      </div>
    );
  }

  // Matches the "N of total" label beside it, which counts the question on
  // screen — the bar used to sit one step behind it.
  const pct = ((index + 1) / questions.length) * 100;

  return (
    <div className={CARD}>
      <div className="flex justify-between items-center mb-2.5 text-[12.5px] font-medium text-faint">
        <span>{t("progress", { current: index + 1, total: questions.length })}</span>
        <span>💧 {t("watered", { count: correct })}</span>
      </div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden mb-6">
        <i
          className="not-italic block h-full bg-success rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {q.mode === "meaning" ? (
        <>
          <p className="kr text-[clamp(30px,5vw,40px)] text-center mb-1">{q.prompt}</p>
          <p className="text-[13px] text-muted mb-6 text-center">{q.word.romanization}</p>
        </>
      ) : (
        <>
          <p className="kr text-[clamp(18px,3vw,22px)] leading-[1.6] mb-1.5 text-center">{q.prompt}</p>
          {q.word.example_en && (
            <p className="text-[13px] text-muted mb-6 text-center">{q.word.example_en}</p>
          )}
        </>
      )}

      <div className={q.mode === "meaning" ? "grid grid-cols-1 gap-2.5" : "grid grid-cols-2 gap-2.5"}>
        {q.options.map((opt) => {
          const correctAnswer = q.mode === "meaning" ? q.word.meaning_en : q.word.korean;
          const isCorrect = opt === correctAnswer;
          const show = selected !== null;
          const state = !show ? "idle" : isCorrect ? "correct" : opt === selected ? "wrong" : "idle";
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              disabled={show}
              className={`${
                q.mode === "blank" ? "kr text-base" : "text-[14.5px]"
              } text-left px-4 py-[13px] rounded-[10px] font-medium transition-all border-[1.5px] disabled:cursor-default ${
                state === "correct"
                  ? "border-success bg-success-bg"
                  : state === "wrong"
                  ? "border-danger bg-danger-bg"
                  : show
                  ? "border-line bg-cream opacity-90"
                  : "border-line bg-cream hover:border-success hover:bg-success-bg"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
