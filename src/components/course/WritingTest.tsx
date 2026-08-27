"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordCompletion } from "@/lib/activity";

export type TestQuestion = { q: string; hint?: string; options: string[]; answer: string };

// Day 16 final writing test — the only quiz in the course.
export default function WritingTest({
  userId,
  stepKey,
  minutes,
  questions,
  initiallyDone,
}: {
  userId: string;
  stepKey: string;
  minutes: number;
  questions: TestQuestion[];
  initiallyDone: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "test" | "result">("intro");
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(initiallyDone);

  const qq = questions[index];

  function answer(option: string) {
    if (selected !== null) return;
    setSelected(option);
    const nextCorrect = correct + (option === qq.answer ? 1 : 0);
    setCorrect(nextCorrect);
    setTimeout(async () => {
      setSelected(null);
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        setPhase("result");
        if (!done) {
          await supabase
            .from("path_progress")
            .upsert({ user_id: userId, step_key: stepKey }, { onConflict: "user_id,step_key" });
          await recordCompletion(supabase, "grammar", minutes);
          setDone(true);
          router.refresh();
        }
      }
    }, option === qq.answer ? 700 : 1500);
  }

  if (phase === "intro") {
    return (
      <div className="border border-line rounded-[14px] p-6 text-center">
        <p className="text-[15px] font-bold mb-1">Build the Korean for {questions.length} English sentences</p>
        <p className="text-[13px] text-muted mb-4">Everything from grammar modules 0–7 shows up here.</p>
        <button
          onClick={() => setPhase("test")}
          className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors"
        >
          Start the test
        </button>
      </div>
    );
  }

  if (phase === "result") {
    return (
      <div className="border border-success-line bg-success-bg rounded-[14px] p-6 text-center">
        <p className="text-[28px] mb-1">🎉</p>
        <p className="text-[16px] font-extrabold mb-1">
          {correct}/{questions.length} correct — course complete!
        </p>
        <p className="text-[13px] text-muted mb-4">
          저는 한국어를 할 수 있어요! — &ldquo;I can speak Korean&rdquo; — and now you can say it.
        </p>
        <Link
          href="/course"
          className="inline-block rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors"
        >
          Back to the course
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-[14px] p-6">
      <p className="text-[11px] font-bold tracking-[.07em] uppercase text-faint mb-1.5">
        {index + 1} / {questions.length}
      </p>
      <p className="font-bold text-[17px] mb-0.5">{qq.q}</p>
      {qq.hint && <p className="text-[12.5px] text-faint mb-2">{qq.hint}</p>}
      <div className="grid gap-2 mt-3">
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
              className={`kr text-left border-[1.5px] rounded-[12px] px-4 py-3 text-[15px] transition-colors ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
