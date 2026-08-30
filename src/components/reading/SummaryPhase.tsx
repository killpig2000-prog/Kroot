import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import type { ProgressResult } from "@/lib/activity";
import type { Passage } from "@/lib/reading";
import type { Gloss } from "@/lib/word-links";

const BTN_BLUE = buttonClassName("sky");
const BTN_INK = buttonClassName("ink");
const BTN_LINE = buttonClassName("line");

// The end of a chapter reports the session back: what was missed, what the
// story is worth looking up, and one obvious way onward.
export default function SummaryPhase({
  passage,
  chapterIndex,
  correct,
  incorrect,
  missed,
  words,
  levelUp,
  hasNextChapter,
  level,
  navigating,
  onGoTo,
  onReRead,
}: {
  passage: Passage;
  chapterIndex: number;
  correct: number;
  incorrect: number;
  /** Indexes of the questions answered wrong. */
  missed: number[];
  words: Gloss[];
  levelUp: ProgressResult | null;
  hasNextChapter: boolean;
  level: string;
  navigating: boolean;
  onGoTo: (href: string) => void;
  onReRead: () => void;
}) {
  return (
    <div className="max-w-[880px]" style={{ animation: "fadeUp .4s ease" }}>
      <div className="text-center mb-6">
        <svg width="92" height="92" viewBox="0 0 150 160" aria-hidden="true" className="inline-block">
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
        <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">
          Chapter {chapterIndex + 1} complete!
        </h2>
        {levelUp && (
          <p className="text-sm font-semibold text-success">
            🎉 Level up! You&apos;re now Lv. {levelUp.new_level}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3 items-start">
        <div className="border border-line rounded-[12px] bg-cream px-4 py-3.5">
          <b className="block text-[24px] font-bold text-sky-deep leading-tight">
            {correct}/{passage.questions.length}
          </b>
          <small className="text-xs text-muted">questions right</small>
          {missed.length > 0 && (
            <>
              <ul className="grid gap-1.5 mt-3">
                {missed.map((i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-muted leading-snug">
                    <span className="text-danger font-bold flex-none">✕</span>
                    <span>{passage.questions[i].question_en}</span>
                  </li>
                ))}
              </ul>
              <button className={`${BTN_LINE} mt-3 w-full text-[13px]`} onClick={onReRead}>
                Read the story again
              </button>
            </>
          )}
          {missed.length === 0 && (
            <p className="text-[13px] text-muted mt-3">Nothing missed — the whole story landed.</p>
          )}
        </div>

        <div className="border border-line rounded-[12px] bg-cream px-4 py-3.5">
          <b className="block text-[24px] font-bold leading-tight">{words.length}</b>
          <small className="text-xs text-muted">words here have a vocabulary page</small>
          {words.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {words.slice(0, 10).map((w) => (
                  <Link
                    key={w.korean}
                    href={w.href}
                    className="kr text-[13px] font-medium rounded-full px-2.5 py-0.5 bg-warm border border-line hover:border-sky-deep hover:text-sky-deep transition-colors"
                  >
                    {w.korean}
                  </Link>
                ))}
              </div>
              <p className="text-[11.5px] text-faint mt-2">
                {words.length > 10 ? `+${words.length - 10} more · ` : ""}
                open one to save it.
              </p>
            </>
          )}
        </div>

        <div className="border border-line rounded-[12px] bg-cream px-4 py-3.5">
          <b className="block text-[24px] font-bold text-success leading-tight">+10 XP</b>
          <small className="text-xs text-muted">
            earned{incorrect > 0 ? ` · ${incorrect} to review` : ""}
          </small>
          <div className="grid gap-2 mt-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}
