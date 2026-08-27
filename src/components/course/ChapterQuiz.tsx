"use client";

import { useState } from "react";
import type { QuizQuestion } from "@/lib/course";

// Optional practice quiz at the end of a chapter. Pure extra study:
// it writes no progress and completion never depends on it.
export default function ChapterQuiz({ questions }: { questions: QuizQuestion[] }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  function reset() {
    setIndex(0);
    setCorrect(0);
    setSelected(null);
    setFinished(false);
  }

  if (!open) {
    return (
      <div className="border border-dashed border-[#D6D3D1] rounded-[14px] px-5 py-4 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <b className="block text-[14px]">Want extra practice? — {questions.length}-question quiz</b>
          <span className="text-[12.5px] text-faint">Totally optional — completing the day never depends on it.</span>
        </div>
        <button
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="flex-none rounded-[9px] px-[18px] py-2.5 text-[13.5px] font-semibold text-success bg-success-bg border border-success-line hover:bg-[#DCFCE7] transition-colors"
        >
          Take the quiz
        </button>
      </div>
    );
  }

  if (finished) {
    const perfect = correct === questions.length;
    return (
      <div className="border border-line rounded-[14px] p-5 text-center">
        <p className="text-[24px] mb-1">{perfect ? "🌟" : "👏"}</p>
        <p className="text-[15px] font-extrabold mb-1">
          {correct}/{questions.length} correct
        </p>
        <p className="text-[12.5px] text-muted mb-3.5">
          {perfect ? "Perfect!" : "Re-read the sections above for the ones you missed."}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="rounded-[9px] px-[18px] py-2 text-[13px] font-semibold text-charcoal bg-white border border-line hover:bg-warm transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-[9px] px-[18px] py-2 text-[13px] font-semibold text-charcoal bg-white border border-line hover:bg-warm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const qq = questions[index];

  function answer(option: string) {
    if (selected !== null) return;
    setSelected(option);
    const ok = option === qq.answer;
    if (ok) setCorrect((c) => c + 1);
    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) setIndex((i) => i + 1);
      else setFinished(true);
    }, ok ? 700 : 1500);
  }

  return (
    <div className="border border-line rounded-[14px] p-5">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint">
          Practice quiz · {index + 1}/{questions.length}
        </p>
        <button
          onClick={() => setOpen(false)}
          className="text-[12px] text-faint hover:text-charcoal transition-colors"
        >
          Stop ✕
        </button>
      </div>
      <p className="font-bold text-[15.5px] mb-0.5">{qq.q}</p>
      {qq.hint && <p className="text-[12.5px] text-faint mb-1.5">{qq.hint}</p>}
      <div className="grid gap-2 mt-2.5">
        {qq.options.map((opt) => {
          const isAnswer = opt === qq.answer;
          const cls =
            selected === null
              ? "border-line bg-white hover:border-success"
              : isAnswer
                ? "border-success bg-success-bg font-bold"
                : selected === opt
                  ? "border-[#EF4444] bg-danger-bg"
                  : "border-line bg-white opacity-60";
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              className={`kr text-left border-[1.5px] rounded-[12px] px-4 py-2.5 text-[14.5px] transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
