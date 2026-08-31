import { useTranslations } from "next-intl";
import type { QuizQuestion } from "@/lib/vocabulary";

const CARD = "max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]";

export default function VocabQuizPhase({
  quizQuestions,
  quizIndex,
  quizKnown,
  selected,
  onAnswer,
}: {
  quizQuestions: QuizQuestion[];
  quizIndex: number;
  quizKnown: number;
  selected: string | null;
  onAnswer: (option: string) => void;
}) {
  const t = useTranslations("vocabulary.quiz");
  const q = quizQuestions[quizIndex];
  // Track the label above it ("3 of 10"), which counts the question on screen.
  // Reading from the pre-increment index left the bar a step behind, so the
  // last question showed "10 of 10" over a bar stuck at 90%.
  const quizPct = quizQuestions.length ? ((quizIndex + 1) / quizQuestions.length) * 100 : 0;

  return (
    <div className={CARD}>
      <div className="flex justify-between items-center mb-2.5 text-[12.5px] font-medium text-faint">
        <span>{t("progress", { current: quizIndex + 1, total: quizQuestions.length })}</span>
        <span>{t("correctCount", { count: quizKnown })}</span>
      </div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden mb-6">
        <i
          className="not-italic block h-full bg-[#6B33CC] rounded-full transition-[width] duration-300"
          style={{ width: `${quizPct}%` }}
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
              onClick={() => onAnswer(opt)}
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
                  : "border-line bg-cream hover:border-[#6B33CC] hover:bg-[var(--tint-violet)]"
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
