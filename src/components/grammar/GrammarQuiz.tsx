"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import { clearResume } from "@/lib/resume";
import { useSaveResume } from "@/hooks/useSaveResume";
import type { GrammarQuiz as Quiz } from "@/lib/grammar";

const ABC = ["A", "B", "C", "D"];
const Q_LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";

function QuestionCard({
  quiz,
  no,
  total,
  onAnswered,
}: {
  quiz: Quiz;
  no: number;
  total: number;
  onAnswered: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === quiz.ans;

  return (
    <div className="border border-line rounded-[14px] p-[clamp(18px,2.5vw,24px)] mb-3.5">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <p className={Q_LABEL} style={{ marginBottom: 0 }}>
          Question {no}
        </p>
        <span className="text-[12.5px] text-faint font-medium">
          {no} of {total}
        </span>
      </div>
      <p className="font-bold text-[16.5px] tracking-[-0.01em] mb-3.5 kr">{quiz.q}</p>

      <div className="grid gap-2.5">
        {quiz.opts.map((opt, i) => {
          const isAns = i === quiz.ans;
          const isPicked = i === picked;
          const state = !answered ? "idle" : isAns ? "correct" : isPicked ? "wrong" : "idle";
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => {
                setPicked(i);
                onAnswered(i === quiz.ans);
              }}
              className={`text-left px-4 py-[13px] rounded-[10px] text-[14.5px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                state === "correct"
                  ? "border-success bg-success-bg"
                  : state === "wrong"
                  ? "border-danger bg-danger-bg"
                  : answered
                  ? "border-line bg-white opacity-90"
                  : "border-line bg-white hover:border-[#423AC5] hover:bg-[#EEF2FF]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-[7px] flex-none flex items-center justify-center text-[11.5px] font-bold border ${
                  state === "correct"
                    ? "bg-success border-success text-white"
                    : state === "wrong"
                    ? "bg-danger border-danger text-white"
                    : "bg-warm border-line text-muted"
                }`}
              >
                {ABC[i]}
              </span>
              <span className="kr">{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-3.5" style={{ animation: "fadeUp .35s ease" }}>
          <span
            className={`inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3 py-1.5 border ${
              correct
                ? "bg-success-bg text-success border-success-line"
                : "bg-danger-bg text-danger border-[#FECACA]"
            }`}
          >
            {correct
              ? "🌱 Correct!"
              : `💧 Not quite — the answer is ${ABC[quiz.ans]}. ${quiz.opts[quiz.ans]}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function GrammarQuizBlock({
  quiz,
  lessonKey,
  lessonTitle,
  level,
  userId,
}: {
  quiz: Quiz[];
  /** Lesson identity for grammar_progress + the dashboard Continue card. */
  lessonKey?: string;
  lessonTitle?: string;
  level?: string;
  userId?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const recorded = useRef(false);
  const answered = useRef(new Set<number>());
  const correctCount = useRef(0);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useSaveResume(
    userId,
    lessonKey
      ? { skill: "grammar", href: `/grammar/${lessonKey}`, label: lessonTitle ?? lessonKey, detail: `Grammar${level ? ` · ${level}` : ""}` }
      : null
  );

  async function markAnswered(i: number, correct: boolean) {
    answered.current.add(i);
    if (correct) correctCount.current += 1;
    if (answered.current.size < quiz.length || recorded.current) return;
    recorded.current = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setDone(true);
    if (lessonKey) {
      // 42P01 (table missing before migration 0035) is silently ignored.
      await supabase.from("grammar_progress").upsert(
        {
          user_id: user.id,
          lesson_key: lessonKey,
          score: Math.round((correctCount.current / quiz.length) * 100),
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_key" }
      );
      void clearResume(supabase, user.id, `/grammar/${lessonKey}`);
    }
    const res = await recordCompletion(supabase, "grammar", 3);
    if (res?.leveled_up) setNewLevel(res.new_level);
  }

  return (
    <div>
      {quiz.map((q, i) => (
        <QuestionCard
          key={i}
          quiz={q}
          no={i + 1}
          total={quiz.length}
          onAnswered={(correct) => markAnswered(i, correct)}
        />
      ))}

      {done && (
        <div className="mt-1" style={{ animation: "fadeUp .35s ease" }}>
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3 py-1.5 border bg-success-bg text-success border-success-line">
            🌱 Quiz done — today&apos;s minutes are on your tree.
          </span>
          {newLevel && (
            <p className="mt-2 text-[13.5px] font-semibold text-success">
              🎉 Level up! Now Lv. {newLevel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
