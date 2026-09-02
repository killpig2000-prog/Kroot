"use client";

import { useTranslations } from "next-intl";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import type { Prompt } from "@/lib/writing";
import type { CefrLevel } from "@/lib/tree";

const LABEL = "text-[11.5px] font-semibold tracking-[.1em] uppercase text-faint";
const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-charcoal bg-cream border border-line hover:bg-warm transition-colors disabled:opacity-60";
const COLOR = "#C47A25";

/** One built sentence's result, checked once here on the result page. */
export type Answer = { index: number; score: number; text: string; correct: boolean; offCount: number };

export default function CompareResult({
  prompts,
  answers,
  score,
  levelUp,
  level,
  chapterIndex,
  hasNextChapter,
  navigating,
  onGoTo,
}: {
  prompts: Prompt[];
  answers: Answer[];
  score: number;
  levelUp: ProgressResult | null;
  level: CefrLevel;
  chapterIndex: number;
  hasNextChapter: boolean;
  navigating: boolean;
  onGoTo: (href: string) => void;
}) {
  const t = useTranslations("writing.result");
  const tn = useTranslations("nav");
  const tu = useTranslations("ui");
  const correctCount = answers.filter((a) => a.correct).length;
  const missedCount = answers.length - correctCount;
  const headline = score >= 90 ? t("headline90") : score >= 75 ? t("headline80") : t("headline60");

  return (
    <ResultShell
      color={COLOR}
      categoryLabel={tn("writing")}
      meta={t("chapterN", { n: chapterIndex + 1 })}
      ring={<ResultRing pct={score} center={score} label={t("grammar")} color={COLOR} />}
      headline={headline}
      tags={
        <>
          {correctCount > 0 && <ResultTag tone="good">{t("natural", { n: correctCount })}</ResultTag>}
          {missedCount > 0 && <ResultTag tone="warn">{t("smallFixes", { n: missedCount })}</ResultTag>}
          <ResultTag>{level}</ResultTag>
        </>
      }
      levelUp={levelUp}
      xpValue={XP_POINTS.writing}
      xpLabel={tu("xpEarned", { skill: tn("writing") })}
      actions={
        <>
          <button className={BTN_LINE} onClick={() => onGoTo("/dashboard")} disabled={navigating}>
            {t("backToGarden")}
          </button>
          <button className={BTN_LINE} onClick={() => onGoTo(`/writing?level=${level}`)} disabled={navigating}>
            {navigating ? t("saving") : t("allChapters")}
          </button>
          {hasNextChapter && (
            <button
              className={BTN_INK}
              onClick={() => onGoTo(`/writing/session?chapter=${chapterIndex + 1}&level=${level}`)}
              disabled={navigating}
            >
              {navigating ? t("saving") : t("turnPage")}
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {answers.map((a) => {
          const prompt = prompts[a.index];
          const firstTry = a.correct;
          return (
            <div
              key={a.index}
              className="border border-line rounded-[14px] bg-cream overflow-hidden grid grid-cols-1 sm:grid-cols-[1fr_170px]"
            >
              <div className="p-[clamp(16px,2.5vw,22px)]">
                <div className="flex items-baseline gap-2.5 mb-3">
                  <span className="text-xs font-extrabold text-amber tracking-[.06em]">Q{a.index + 1}</span>
                  {prompt && <span className="kr text-sm font-bold text-muted">{prompt.prompt_kr}</span>}
                </div>
                <p className="kr text-[16px] leading-[1.7]">{a.text}</p>
                <div className="flex gap-2 mt-2.5 text-[12.5px] text-muted leading-[1.5]">
                  <span className="flex-none w-5 h-5 rounded-[6px] bg-[var(--tint-amber)] text-amber text-[11px] font-extrabold flex items-center justify-center">
                    i
                  </span>
                  <span>{firstTry ? t("builtFirstTry") : t("builtAfterTries", { n: a.offCount })}</span>
                </div>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-dashed border-line bg-warm p-[clamp(16px,2.5vw,18px)] flex sm:flex-col items-center sm:items-start gap-3 flex-wrap">
                <span
                  className={`self-start text-[11px] font-bold px-2.5 py-1 rounded-md ${
                    firstTry ? "bg-success-bg text-success-deep" : "bg-[var(--tint-amber)] text-amber"
                  }`}
                >
                  {firstTry ? t("naturalBadge") : t("needsFix")}
                </span>
                <div className="text-[26px] font-extrabold tracking-[-0.03em] leading-none tabular-nums">
                  {a.score}
                  <small className="text-xs text-faint font-semibold">/100</small>
                </div>
                <div className="h-1.5 rounded-full bg-line overflow-hidden flex-1 sm:w-full sm:flex-none min-w-[100px]">
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: `${a.score}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-[14px] p-4 border bg-success-bg border-success-line">
        <h3 className={`${LABEL} text-success-deep mb-2.5`}>{t("focusTitle")}</h3>
        <p className="text-[17px] font-extrabold tracking-[-0.02em] leading-[1.35] text-success-deep" style={{ textWrap: "balance" }}>
          {missedCount === 0 ? t("fallbackFocusPerfect") : t("fallbackFocusRetries")}
        </p>
        {prompts[0]?.example_kr && (
          <div className="mt-3 px-3.5 py-3 bg-cream border border-success-line rounded-[10px]">
            <span className={`${LABEL} block mb-1`}>{t("tryIt")}</span>
            <p className="kr text-[15px] leading-[1.7]">{prompts[0].example_kr}</p>
          </div>
        )}
        <p className="text-[12.5px] text-success font-semibold mt-2.5">{t("nextChapterChecks")}</p>
      </div>
    </ResultShell>
  );
}
