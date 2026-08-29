import { useState } from "react";
import { speakKorean } from "@/lib/tts";
import type { McqQuestion } from "@/lib/promotion-test";

export default function Mcq({
  questions,
  showKr,
  onDone,
  title,
  passage,
}: {
  questions: McqQuestion[];
  showKr: boolean;
  onDone: (correct: number) => void;
  title: string;
  passage?: string;
}) {
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const qq = questions[index];

  function answer(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const next = correct + (opt === qq.answer ? 1 : 0);
    setCorrect(next);
    setTimeout(() => {
      setSelected(null);
      if (index + 1 < questions.length) setIndex((i) => i + 1);
      else onDone(next);
    }, opt === qq.answer ? 600 : 1300);
  }

  return (
    <div>
      <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint mb-2">
        {title} · {index + 1}/{questions.length}
      </p>
      {passage && (
        <p className="kr border border-line bg-warm rounded-[12px] px-4 py-3 text-[15.5px] leading-[1.8] mb-4">
          {passage}
        </p>
      )}
      {qq.kr && !showKr && (
        <button
          onClick={() => speakKorean(qq.kr)}
          className="mb-3 w-14 h-14 rounded-full bg-[#FF9E7D] text-white text-[22px] shadow-[0_3px_0_#f08560]"
          aria-label="Play audio"
        >
          🔊
        </button>
      )}
      <p className="font-bold text-[16px] mb-3">{qq.question}</p>
      <div className="grid gap-2">
        {qq.options.map((opt) => {
          const isAnswer = opt === qq.answer;
          const cls =
            selected === null
              ? "border-line bg-cream hover:border-success"
              : isAnswer
                ? "border-success bg-success-bg font-bold"
                : selected === opt
                  ? "border-[#EF4444] bg-danger-bg"
                  : "border-line bg-cream opacity-60";
          return (
            <button
              key={opt}
              onClick={() => answer(opt)}
              className={`text-left border-[1.5px] rounded-[12px] px-4 py-3 text-[14.5px] transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
