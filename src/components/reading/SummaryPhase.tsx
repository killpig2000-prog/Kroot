import { buttonClassName } from "@/components/ui/Button";
import type { ProgressResult } from "@/lib/activity";
import type { Passage } from "@/lib/reading";

const BTN_BLUE = buttonClassName("sky");
const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");

export default function SummaryPhase({
  passage,
  chapterIndex,
  correct,
  incorrect,
  levelUp,
  hasNextChapter,
  level,
  navigating,
  onGoTo,
}: {
  passage: Passage;
  chapterIndex: number;
  correct: number;
  incorrect: number;
  levelUp: ProgressResult | null;
  hasNextChapter: boolean;
  level: string;
  navigating: boolean;
  onGoTo: (href: string) => void;
}) {
  return (
    <div
      className="max-w-[680px] text-center border border-line rounded-[14px] px-7 py-10"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <svg width="104" height="104" viewBox="0 0 150 160" aria-hidden="true" className="inline-block">
        <ellipse cx="75" cy="150" rx="46" ry="7" fill="#E3DDD0" />
        <path d="M75 146 C75 122 74 112 74 98" stroke="#8B7355" strokeWidth="8" strokeLinecap="round" />
        <g className="sway">
          <circle cx="75" cy="72" r="36" fill="#22C55E" />
          <circle cx="49" cy="88" r="18" fill="#4ADE80" />
          <circle cx="101" cy="88" r="18" fill="#4ADE80" />
          <circle className="blink" cx="64" cy="72" r="3.6" fill="#14532D" />
          <circle className="blink d2" cx="86" cy="72" r="3.6" fill="#14532D" />
          <path d="M66 82 Q75 90 84 82" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="58" r="5.5" fill="#FACC15" />
          <circle cx="102" cy="56" r="5.5" fill="#FB7185" />
        </g>
        <text x="116" y="54" fontSize="20">
          📖
        </text>
      </svg>
      <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">Chapter {chapterIndex + 1} complete!</h2>
      <p className="text-sm text-muted mb-[22px]">
        You read the whole story — your tree grew a little today.
      </p>
      {levelUp && (
        <p className="text-sm font-semibold text-success mb-[22px] -mt-3">
          🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
        </p>
      )}

      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-sky-deep">
            {correct}/{passage.questions.length}
          </b>
          <small className="text-xs text-muted">Correct</small>
        </div>
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold">{incorrect}</b>
          <small className="text-xs text-muted">To review</small>
        </div>
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-success">+10 XP</b>
          <small className="text-xs text-muted">Earned</small>
        </div>
      </div>

      <div className="flex justify-center gap-2.5 flex-wrap">
        {hasNextChapter && (
          <button
            className={BTN_BLUE}
            onClick={() => onGoTo(`/reading/session?chapter=${chapterIndex + 1}&level=${level}`)}
            disabled={navigating}
          >
            {navigating ? "Saving…" : `Chapter ${chapterIndex + 2} →`}
          </button>
        )}
        <button
          className={hasNextChapter ? BTN_LINE : BTN_INK}
          onClick={() => onGoTo(`/reading?level=${level}`)}
          disabled={navigating}
        >
          {navigating ? "Saving…" : "Story map"}
        </button>
        <button className={BTN_LINE} onClick={() => onGoTo("/dashboard")} disabled={navigating}>
          Back to my garden
        </button>
      </div>
    </div>
  );
}
