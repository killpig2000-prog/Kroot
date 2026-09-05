"use client";

import { useTranslations } from "next-intl";
import ResultShell, { ResultRing, ResultTag } from "@/components/results/ResultShell";
import { XP_POINTS, type ProgressResult } from "@/lib/activity";
import type { Prompt } from "@/lib/writing";
import type { CefrLevel } from "@/lib/tree";

const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-charcoal bg-cream border border-line hover:bg-warm transition-colors disabled:opacity-60";
const COLOR = "#C47A25";

/** One built sentence's result — scored on the question itself; totalled here. */
export type Answer = { index: number; score: number; text: string; correct: boolean; offCount: number };

export default function CompareResult({
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
      {/* Each question was scored the moment it was checked, with the
          sentence right there — so this page only totals it up. Re-showing
          all three sentences here read as a second round of corrections. */}
      <div className="flex gap-2 flex-wrap">
        {answers.map((a) => (
          <span
            key={a.index}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold tabular-nums ${
              a.correct ? "bg-success-bg border-success-line text-success-deep" : "bg-[var(--tint-amber)] border-amber-line text-amber"
            }`}
          >
            <span className="opacity-70">Q{a.index + 1}</span>
            {a.score}
          </span>
        ))}
      </div>
    </ResultShell>
  );
}
