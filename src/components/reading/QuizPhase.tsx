"use client";

import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import GlossedText from "@/components/reading/GlossedText";
import type { Passage, PassageLine } from "@/lib/reading";
import type { Gloss } from "@/lib/word-links";

const ABC = ["A", "B", "C", "D"];
const BTN_BLUE = buttonClassName("sky");

// Reading comprehension is open-book: the passage stays on screen, and once
// the reader answers, the line the answer came from is marked in it. A wrong
// answer should teach where to look, not just flash red.
export default function QuizPhase({
  passage,
  lines,
  glossary,
  qIndex,
  answers,
  selected,
  evidenceIndex,
  onAnswer,
  onNext,
}: {
  passage: Passage;
  lines: PassageLine[];
  glossary: Record<string, Gloss>;
  qIndex: number;
  /** One entry per question so far: true = right, false = wrong. */
  answers: (boolean | null)[];
  selected: number | null;
  /** Line of the passage that answers this question, when one is clear. */
  evidenceIndex: number | null;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
}) {
  const t = useTranslations("reading.quiz");
  const question = passage.questions[qIndex];
  const answered = selected !== null;
  const gotIt = answered && selected === question.answerIndex;
  const correct = answers.filter((a) => a === true).length;
  const last = qIndex + 1 >= passage.questions.length;
  const evidence = evidenceIndex !== null ? lines[evidenceIndex] : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,.92fr)] items-start max-w-[1040px]">
      {/* the passage, still there */}
      <div className="bg-cream border border-line rounded-[14px] px-[clamp(14px,2.6vw,20px)] py-[clamp(14px,2.6vw,18px)] order-2 lg:order-1">
        <h3 className="text-[11px] font-semibold tracking-[.08em] uppercase text-faint mb-2">
          {t("passage")}
        </h3>
        <div className="max-h-[420px] overflow-y-auto grid gap-1 pr-1">
          {lines.map((line, i) => (
            <p
              key={i}
              className={`kr text-[14.5px] leading-[1.9] rounded-[7px] px-2 py-0.5 transition-colors ${
                answered && i === evidenceIndex
                  ? "bg-[var(--tint-amber)] shadow-[inset_0_0_0_1px_var(--c-amber-line)] text-charcoal"
                  : "text-muted"
              }`}
            >
              <GlossedText text={line.kr} glossary={glossary} />
            </p>
          ))}
        </div>
      </div>

      {/* the question */}
      <div className="bg-cream border border-line rounded-[14px] px-[clamp(16px,3vw,22px)] py-[clamp(16px,3vw,20px)] order-1 lg:order-2">
        <div className="flex justify-between items-center mb-2 text-[12.5px] font-medium text-faint">
          <span>{t("questionOf", { n: qIndex + 1, total: passage.questions.length })}</span>
          <span>{t("correctCount", { n: correct })}</span>
        </div>
        <div className="flex gap-1 mb-5" aria-hidden="true">
          {passage.questions.map((_, i) => (
            <i
              key={i}
              className={`not-italic block h-1 flex-1 rounded-full ${
                answers[i] === true
                  ? "bg-success"
                  : answers[i] === false
                  ? "bg-danger"
                  : i === qIndex
                  ? "bg-sky-deep"
                  : "bg-line"
              }`}
            />
          ))}
        </div>

        <p className="font-bold text-[17px] tracking-[-0.01em] mb-3.5 leading-snug">
          {question.question_en}
        </p>

        <div className="grid gap-2.5">
          {question.options.map((opt, i) => {
            const isCorrect = i === question.answerIndex;
            const state = !answered ? "idle" : isCorrect ? "correct" : i === selected ? "wrong" : "idle";
            return (
              <button
                key={opt}
                onClick={() => onAnswer(i)}
                disabled={answered}
                className={`text-left px-4 py-[13px] rounded-[10px] text-[14.5px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                  state === "correct"
                    ? "border-success bg-success-bg"
                    : state === "wrong"
                    ? "border-danger bg-danger-bg"
                    : answered
                    ? "border-line bg-cream opacity-90"
                    : "border-line bg-cream hover:border-sky-deep hover:bg-[var(--tint-sky)]"
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
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (evidence || !gotIt) && (
          <div
            className={`mt-3.5 rounded-r-[10px] border-l-2 pl-3.5 pr-3 py-2.5 ${
              gotIt ? "border-success bg-success-bg" : "border-amber bg-[var(--tint-amber)]"
            }`}
          >
            <p className="text-[11px] font-semibold tracking-[.07em] uppercase text-muted mb-1">
              {evidence ? t("whereItSays") : t("theAnswer")}
            </p>
            {evidence ? (
              <>
                <p className="kr text-[14.5px] font-medium leading-[1.7]">{evidence.kr}</p>
                {evidence.en && <p className="text-[13px] text-muted italic mt-0.5">{evidence.en}</p>}
              </>
            ) : (
              <p className="text-[14px] font-medium">{question.options[question.answerIndex]}</p>
            )}
          </div>
        )}

        {/* No auto-advance: the reader moves on once they've read the line. */}
        <div className="flex justify-end mt-4">
          <button className={BTN_BLUE} onClick={onNext} disabled={!answered}>
            {last ? t("seeResult") : t("nextQuestion")}
          </button>
        </div>
      </div>
    </div>
  );
}
