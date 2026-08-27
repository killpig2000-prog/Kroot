import type { Passage } from "@/lib/reading";

const ABC = ["A", "B", "C", "D"];
const LABEL = "text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint mb-2";

export default function QuizPhase({
  passage,
  qIndex,
  correct,
  selected,
  onAnswer,
}: {
  passage: Passage;
  qIndex: number;
  correct: number;
  selected: number | null;
  onAnswer: (optionIndex: number) => void;
}) {
  const question = passage.questions[qIndex];
  const pct = (qIndex / passage.questions.length) * 100;

  return (
    <div className="max-w-[680px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]">
      <div className="flex justify-between items-center mb-2.5 text-[12.5px] font-medium text-faint">
        <span>
          Question {qIndex + 1} of {passage.questions.length}
        </span>
        <span>{correct} correct</span>
      </div>
      <div className="h-1.5 bg-line rounded-full overflow-hidden mb-6">
        <i
          className="not-italic block h-full bg-sky-deep rounded-full transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className={LABEL}>Question</p>
      <p className="font-bold text-[17px] tracking-[-0.01em] mb-3.5">{question.question_en}</p>

      <div className="grid gap-2.5">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.answerIndex;
          const show = selected !== null;
          const state = !show ? "idle" : isCorrect ? "correct" : i === selected ? "wrong" : "idle";
          return (
            <button
              key={opt}
              onClick={() => onAnswer(i)}
              disabled={show}
              className={`text-left px-4 py-[13px] rounded-[10px] text-[14.5px] font-medium flex items-center gap-2.5 transition-all border-[1.5px] disabled:cursor-default ${
                state === "correct"
                  ? "border-success bg-success-bg"
                  : state === "wrong"
                  ? "border-danger bg-danger-bg"
                  : show
                  ? "border-line bg-white opacity-90"
                  : "border-line bg-white hover:border-sky-deep hover:bg-[#EFF6FF]"
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
    </div>
  );
}
