"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient, getClientUserId } from "@/lib/supabase/client";
import { recordCompletion, XP_POINTS, type ProgressResult } from "@/lib/activity";
import { grammarLessonKey } from "@/lib/reward-keys";
import { clearResume, isTableMissing } from "@/lib/resume";
import { useSaveResume } from "@/hooks/useSaveResume";
import ResultShell, { ResultRing } from "@/components/results/ResultShell";
import type { GrammarQuiz as Quiz } from "@/lib/grammar";

const GRAMMAR_COLOR = "#423AC5";

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
  const t = useTranslations("grammarUi.quiz");
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === quiz.ans;

  return (
    <div className="border border-line rounded-[14px] p-[clamp(18px,2.5vw,24px)] mb-3.5">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
        <p className={Q_LABEL} style={{ marginBottom: 0 }}>
          {t("question", { n: no })}
        </p>
        <span className="text-[12.5px] text-faint font-medium">
          {t("progress", { n: no, total })}
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
                  ? "border-line bg-cream opacity-90"
                  : "border-line bg-cream hover:border-[#423AC5] hover:bg-[var(--tint-indigo)]"
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
                : "bg-danger-bg text-danger border-[var(--tint-rose-line)]"
            }`}
          >
            {correct
              ? t("correct")
              : t("wrong", { letter: ABC[quiz.ans], text: quiz.opts[quiz.ans] })}
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
  const t = useTranslations("grammarUi");
  const tu = useTranslations("ui");
  const supabase = useMemo(() => createClient(), []);
  const recorded = useRef(false);
  const answered = useRef(new Set<number>());
  const correctCount = useRef(0);
  const [levelUp, setLevelUp] = useState<ProgressResult | null>(null);
  const [done, setDone] = useState(false);

  useSaveResume(
    userId,
    lessonKey
      ? { skill: "grammar", href: `/grammar/${lessonKey}`, label: lessonTitle ?? lessonKey, detail: `${t("resumeDetail")}${level ? ` · ${level}` : ""}` }
      : null
  );

  async function markAnswered(i: number, correct: boolean) {
    answered.current.add(i);
    if (correct) correctCount.current += 1;
    if (answered.current.size < quiz.length || recorded.current) return;
    recorded.current = true;

    // The page already resolved the viewer server-side and passes it in; only
    // fall back to reading the session when it didn't.
    const uid = userId ?? (await getClientUserId(supabase));
    if (!uid) return;

    setDone(true);
    if (lessonKey) {
      const { error } = await supabase.from("grammar_progress").upsert(
        {
          user_id: uid,
          lesson_key: lessonKey,
          score: Math.round((correctCount.current / quiz.length) * 100),
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,lesson_key" }
      );
      // 42P01 (table missing before migration 0035) stays ignored on purpose.
      // Anything else means the lesson was not recorded, so release the guard:
      // answering the last question again is then able to retry it, instead of
      // the lesson silently staying incomplete on the grammar list.
      if (error && !isTableMissing(error)) {
        recorded.current = false;
        answered.current.delete(i);
      }
      void clearResume(supabase, uid, `/grammar/${lessonKey}`);
    }
    const res = await recordCompletion(
      supabase,
      "grammar",
      3,
      0,
      lessonKey ? grammarLessonKey(lessonKey) : null,
      Math.round((correctCount.current / quiz.length) * 100),
      level,
    );
    setLevelUp(res);
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
        <div className="mt-3.5">
          <ResultShell
            color={GRAMMAR_COLOR}
            categoryLabel="Grammar"
            meta={lessonTitle}
            ring={
              <ResultRing
                pct={(correctCount.current / quiz.length) * 100}
                center={correctCount.current}
                unit={`/${quiz.length}`}
                label="correct"
                color={GRAMMAR_COLOR}
              />
            }
            headline={t("quiz.done")}
            levelUp={levelUp}
            xpValue={XP_POINTS.grammar}
            xpLabel={tu("xpEarned", { skill: "Grammar" })}
          />
        </div>
      )}
    </div>
  );
}
