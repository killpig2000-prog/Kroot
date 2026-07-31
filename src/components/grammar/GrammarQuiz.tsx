"use client";

import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";
import type { GrammarQuiz as Quiz } from "@/lib/grammar";

const ABC = ["A", "B", "C", "D"];
const Q_LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A1A1AA] mb-2";

function QuestionCard({
  quiz,
  no,
  total,
  onAnswered,
}: {
  quiz: Quiz;
  no: number;
  total: number;
  onAnswered: () => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === quiz.ans;

  return (
    <div className="border border-[#E7E5E4] rounded-[14px] p-[clamp(18px,2.5vw,24px)] mb-3.5">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <p className={Q_LABEL} style={{ marginBottom: 0 }}>
          Question {no}
        </p>
        <span className="text-[12.5px] text-[#A1A1AA] font-medium">
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
                onAnswered();
              }}
              className={`text-left px-4 py-[13px] rounded-[10px] text-[14.5px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                state === "correct"
                  ? "border-[#16A34A] bg-[#F0FDF4]"
                  : state === "wrong"
                  ? "border-[#DC2626] bg-[#FEF2F2]"
                  : answered
                  ? "border-[#E7E5E4] bg-white opacity-90"
                  : "border-[#E7E5E4] bg-white hover:border-[#4F46E5] hover:bg-[#EEF2FF]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-[7px] flex-none flex items-center justify-center text-[11.5px] font-bold border ${
                  state === "correct"
                    ? "bg-[#16A34A] border-[#16A34A] text-white"
                    : state === "wrong"
                    ? "bg-[#DC2626] border-[#DC2626] text-white"
                    : "bg-[#FAFAF9] border-[#E7E5E4] text-[#71717A]"
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
                ? "bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]"
                : "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]"
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

export default function GrammarQuizBlock({ quiz }: { quiz: Quiz[] }) {
  const supabase = useMemo(() => createClient(), []);
  const recorded = useRef(false);
  const answered = useRef(new Set<number>());
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  async function markAnswered(i: number) {
    answered.current.add(i);
    if (answered.current.size < quiz.length || recorded.current) return;
    recorded.current = true;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setDone(true);
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
          onAnswered={() => markAnswered(i)}
        />
      ))}

      {done && (
        <div className="mt-1" style={{ animation: "fadeUp .35s ease" }}>
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-lg px-3 py-1.5 border bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]">
            🌱 Quiz done — today&apos;s minutes are on your tree.
          </span>
          {newLevel && (
            <p className="mt-2 text-[13.5px] font-semibold text-[#16A34A]">
              🎉 Level up! Now Lv. {newLevel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
