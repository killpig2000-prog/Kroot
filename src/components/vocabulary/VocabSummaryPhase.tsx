import { useTranslations } from "next-intl";
import { buttonClassName } from "@/components/ui/Button";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import type { VocabWordWithProgress } from "@/lib/vocabulary";

const BTN_LINE = buttonClassName("line");
const COLOR = "#6B33CC";

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
  const tn = useTranslations("nav");
  const tu = useTranslations("ui");
  const pct = words.length ? Math.round((known / words.length) * 100) : 0;

  return (
    <ResultShell
      color={COLOR}
      categoryLabel={tn("vocabulary")}
      meta={t("dayN", { n: chapterIndex + 1 })}
      ring={<ResultRing pct={pct} center={known} unit={`/${words.length}`} label={t("summary.markedKnown")} color={COLOR} />}
      headline={t("summary.title", { count: words.length })}
      sub={t("summary.sub")}
      tags={
        <>
          {tricky > 0 && <ResultTag tone="warn">{t("stillLearning")} · {tricky}</ResultTag>}
          {tookQuiz && (
            <ResultTag tone={quizTricky === 0 ? "good" : "neutral"}>
              {t("summary.quizStat")} {quizKnown}/{quizKnown + quizTricky}
            </ResultTag>
          )}
          <ResultTag>{t("summary.chapterDone")}</ResultTag>
        </>
      }
      levelUp={levelUp}
      xpValue={XP_POINTS.vocabulary}
      xpLabel={tu("xpEarned", { skill: tn("vocabulary") })}
      actions={
        <>
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
        </>
      }
    />
  );
}
