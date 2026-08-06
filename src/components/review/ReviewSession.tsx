"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion, type ProgressResult } from "@/lib/activity";
import { nextBox, nextReviewAt } from "@/lib/srs";
import { buildQuizQuestions, type QuizQuestion, type VocabWordWithProgress } from "@/lib/vocabulary";

const REVIEW_MINUTES = 5;

const CARD = "max-w-[560px] border border-[#E3DDD0] rounded-[14px] p-[clamp(20px,3vw,28px)]";

export default function ReviewSession({
  words,
  userId,
}: {
  words: VocabWordWithProgress[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [questions] = useState<QuizQuestion[]>(() => buildQuizQuestions(words));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [missed, setMissed] = useState<VocabWordWithProgress[]>([]);
  const [done, setDone] = useState(false);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [navigating, setNavigating] = useState(false);
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

    await supabase.from("vocabulary_progress").upsert(
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
    if (result?.leveled_up) setLevelUp(result);
  }

  async function goTo(href: string) {
    setNavigating(true);
    await logOnce();
    router.push(href);
    router.refresh();
  }

  if (done) {
    const kept = correct;
    const slipped = missed.length;
    return (
      <div className={`${CARD} text-center`} style={{ animation: "fadeUp .4s ease" }}>
        <p className="text-4xl mb-2">💧</p>
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mb-1.5">Garden watered!</h2>
        <p className="text-sm text-[#6B6560] mb-5">
          {kept} of {questions.length} words are rooted deeper.
          {slipped > 0 && " The ones that slipped will come back tomorrow."}
        </p>
        {levelUp && (
          <p className="text-sm font-semibold text-[#16A34A] mb-5 -mt-2">
            🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
          </p>
        )}

        {slipped > 0 && (
          <div className="text-left border border-[#FDE68A] bg-[#FFFBEB] rounded-[10px] px-4 py-3 mb-6">
            <b className="block text-[12.5px] font-semibold text-[#92400E] mb-1.5">
              Back in the watering can:
            </b>
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

        <div className="flex justify-center gap-2.5 flex-wrap">
          <button
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#15803D] transition-colors disabled:opacity-60"
            onClick={() => goTo("/dashboard")}
            disabled={navigating}
          >
            {navigating ? "Saving…" : "Back to my garden"}
          </button>
          <button
            className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-[#18181B] bg-white border border-[#E3DDD0] hover:bg-[#FAF7EF] transition-colors disabled:opacity-60"
            onClick={() => goTo("/review")}
            disabled={navigating}
          >
            {navigating ? "Saving…" : "More to water?"}
          </button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  if (!q) {
    return (
      <div className={`${CARD} text-center`}>
        <p className="font-bold text-[17px] mb-1.5">Nothing to review</p>
        <Link href="/dashboard" className="text-sm font-semibold text-[#16A34A] hover:underline">
          Back to my garden
        </Link>
      </div>
    );
  }

  const pct = (index / questions.length) * 100;

  return (
    <div className={CARD}>
      <div className="flex justify-between items-center mb-2.5 text-[12.5px] font-medium text-[#A19A8C]">
        <span>
          Watering · {index + 1} of {questions.length}
        </span>
        <span>💧 {correct} watered</span>
      </div>
      <div className="h-1.5 bg-[#E3DDD0] rounded-full overflow-hidden mb-6">
        <i
          className="not-italic block h-full bg-[#16A34A] rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      {q.mode === "meaning" ? (
        <>
          <p className="kr text-[clamp(30px,5vw,40px)] text-center mb-1">{q.prompt}</p>
          <p className="text-[13px] text-[#6B6560] mb-6 text-center">{q.word.romanization}</p>
        </>
      ) : (
        <>
          <p className="kr text-[clamp(18px,3vw,22px)] leading-[1.6] mb-1.5 text-center">{q.prompt}</p>
          {q.word.example_en && (
            <p className="text-[13px] text-[#6B6560] mb-6 text-center">{q.word.example_en}</p>
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
                  ? "border-[#16A34A] bg-[#F0FDF4]"
                  : state === "wrong"
                  ? "border-[#DC2626] bg-[#FEF2F2]"
                  : show
                  ? "border-[#E3DDD0] bg-white opacity-90"
                  : "border-[#E3DDD0] bg-white hover:border-[#16A34A] hover:bg-[#F0FDF4]"
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
