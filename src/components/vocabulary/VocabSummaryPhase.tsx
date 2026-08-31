import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import type { ProgressResult } from "@/lib/activity";
import type { VocabWordWithProgress } from "@/lib/vocabulary";

const BTN_LINE = buttonClassName("line");
const CARD = "max-w-[560px] border border-line rounded-[14px] p-[clamp(20px,3vw,28px)]";

export default function VocabSummaryPhase({
  words,
  known,
  tricky,
  tookQuiz,
  quizKnown,
  quizTricky,
  levelUp,
  hasNextChapter,
  topicKey,
  chapterIndex,
  navigating,
  onGoTo,
}: {
  words: VocabWordWithProgress[];
  known: number;
  tricky: number;
  tookQuiz: boolean;
  quizKnown: number;
  quizTricky: number;
  levelUp: ProgressResult | null;
  hasNextChapter: boolean;
  topicKey: string;
  chapterIndex: number;
  navigating: boolean;
  onGoTo: (href: string) => void;
}) {
  const t = useTranslations("vocabulary");
  const tu = useTranslations("ui");
  return (
    <div className={`${CARD} text-center`} style={{ animation: "fadeUp .4s ease" }}>
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
      </svg>
      <h2 className="font-bold text-[21px] tracking-[-0.02em] mt-3 mb-1.5">
        {t("summary.title", { count: words.length })} 🌱
      </h2>
      <p className="text-sm text-muted mb-[22px]">{t("summary.sub")}</p>
      {levelUp && (
        <p className="text-sm font-semibold text-success mb-[22px] -mt-3">
          🎉 {t("summary.levelUp", { level: levelUp.new_level })}
        </p>
      )}

      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold text-success">{known}</b>
          <small className="text-xs text-muted">{t("summary.markedKnown")}</small>
        </div>
        <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
          <b className="block text-[19px] font-bold">{tricky}</b>
          <small className="text-xs text-muted">{t("stillLearning")}</small>
        </div>
        {tookQuiz && (
          <div className="border border-line rounded-[10px] px-5 py-3 min-w-[100px]">
            <b className="block text-[19px] font-bold text-success">
              {quizKnown}/{quizKnown + quizTricky}
            </b>
            <small className="text-xs text-muted">{t("summary.quizStat")}</small>
          </div>
        )}
      </div>

      <span className="inline-flex items-center gap-2 bg-success-bg border border-success-line rounded-full px-[18px] py-2 text-[13.5px] font-semibold text-success mb-6">
        💧 {t("summary.chapterDone")}
      </span>

      <div className="flex justify-center gap-2.5 flex-wrap">
        <button
          className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60"
          onClick={() => onGoTo(`/vocabulary?level=${words[0].level}`)}
          disabled={navigating}
        >
          {navigating ? tu("saving") : tu("chooseAnother")}
        </button>
        {hasNextChapter && (
          <button
            className={BTN_LINE}
            onClick={() =>
              onGoTo(`/vocabulary/${topicKey}/session?chapter=${chapterIndex + 1}&level=${words[0].level}`)
            }
            disabled={navigating}
          >
            {navigating ? tu("saving") : t("summary.moreWords", { count: words.length })}
          </button>
        )}
      </div>
    </div>
  );
}
