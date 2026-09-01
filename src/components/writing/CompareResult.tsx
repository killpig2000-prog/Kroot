"use client";

import { useTranslations } from "next-intl";
import type { ProgressResult } from "@/lib/activity";
import type { Prompt } from "@/lib/writing";
import type { CefrLevel } from "@/lib/tree";

const CARD = "border border-line rounded-[16px] bg-cream max-w-[900px] overflow-hidden";
const LABEL = "text-[11.5px] font-semibold tracking-[.1em] uppercase text-faint";
const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-charcoal bg-cream border border-line hover:bg-warm transition-colors disabled:opacity-60";

const CIRC = 2 * Math.PI * 70;

/** One built sentence's result — always exact (tiles only check order), so
 * there's nothing to "correct"; only how many tries it took. */
export type Answer = { index: number; score: number; text: string; checks: number };

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
  const tu = useTranslations("ui");
  const firstTryCount = answers.filter((a) => a.checks <= 1).length;
  const practicedCount = answers.length - firstTryCount;
  const offset = CIRC - (Math.max(0, Math.min(100, score)) / 100) * CIRC;
  const headline = score >= 90 ? t("headline90") : score >= 75 ? t("headline80") : t("headline60");

  return (
    <div className="flex flex-col gap-3.5" style={{ animation: "fadeUp .4s ease" }}>
      <div className={CARD}>
        <div className="p-[clamp(20px,3vw,32px)] grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-7 items-center border-b border-dashed border-line bg-cream">
          <div className="relative w-[168px] h-[168px] mx-auto">
            <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--color-line)" strokeWidth="12" />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.7,.2,1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[44px] font-extrabold tracking-[-0.04em] leading-none tabular-nums">
                {score}
                <small className="text-sm text-faint font-semibold">/100</small>
              </div>
              <div className="text-[11px] font-bold tracking-[.1em] uppercase text-muted mt-1">{t("grammar")}</div>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h2 className="font-extrabold text-[26px] sm:text-[28px] tracking-[-0.025em]" style={{ textWrap: "balance" }}>
              {headline}
            </h2>
            <div className="flex gap-2 flex-wrap mt-4 justify-center sm:justify-start">
              {firstTryCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1.5 rounded-full border bg-success-bg text-success-deep border-success-line">
                  {t("natural", { n: firstTryCount })}
                </span>
              )}
              {practicedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1.5 rounded-full border bg-[var(--tint-amber)] text-amber border-amber-line">
                  {t("smallFixes", { n: practicedCount })}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1.5 rounded-full border bg-cream text-muted border-line">
                {t("chapterN", { n: chapterIndex + 1 })}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-line">
          <div className="px-4 sm:px-6 py-4">
            <b className="block text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">
              {answers.length} <em className="text-[13px] font-semibold text-success not-italic">{t("answers")}</em>
            </b>
            <span className="text-xs text-muted">{t("checkedOneGo")}</span>
          </div>
          {levelUp?.leveled_up ? (
            <div className="px-4 sm:px-6 py-4">
              <b className="block text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">
                {t("levelUpValue", { n: levelUp.new_level })}
              </b>
              <span className="text-xs text-muted">{t("levelUpSub")}</span>
            </div>
          ) : (
            <div className="px-4 sm:px-6 py-4">
              <b className="block text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">
                {t("chapterN", { n: chapterIndex + 1 })}
              </b>
              <span className="text-xs text-muted">{t("complete")}</span>
            </div>
          )}
          <div className="px-4 sm:px-6 py-4">
            <b className="block text-[20px] sm:text-[22px] font-extrabold tracking-[-0.02em] tabular-nums">{level}</b>
            <span className="text-xs text-muted">{t("yourLevel")}</span>
          </div>
        </div>
        {(levelUp?.coins_earned ?? 0) > 0 && (
          <div className="flex items-center justify-center gap-1.5 border-t border-amber-line bg-[var(--tint-amber)] py-2.5">
            <b className="text-[15px] font-extrabold text-[#B7791F]">{tu("coinsEarned", { n: levelUp!.coins_earned })}</b>
            <span className="text-[12px] font-semibold text-[#B7791F]/80">{tu("coinsEarnedLabel")}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {answers.map((a) => {
          const prompt = prompts[a.index];
          const firstTry = a.checks <= 1;
          return (
            <div key={a.index} className={`${CARD} grid grid-cols-1 sm:grid-cols-[1fr_180px]`}>
              <div className="p-[clamp(18px,2.5vw,26px)]">
                <div className="flex items-baseline gap-2.5 mb-3.5">
                  <span className="text-xs font-extrabold text-amber tracking-[.06em]">Q{a.index + 1}</span>
                  {prompt && <span className="kr text-sm font-bold text-muted">{prompt.prompt_kr}</span>}
                </div>
                <p className="kr text-[17px] leading-[1.75]">{a.text}</p>
                <p className="text-[13px] text-success font-semibold flex items-center gap-1.5 mt-2.5">{t("alreadyNatural")}</p>
                <div className="flex gap-2 mt-3 text-[13px] text-muted leading-[1.55]">
                  <span className="flex-none w-5 h-5 rounded-[6px] bg-[var(--tint-amber)] text-amber text-[11px] font-extrabold flex items-center justify-center">
                    i
                  </span>
                  <span>{firstTry ? t("builtFirstTry") : t("builtAfterTries", { n: a.checks })}</span>
                </div>
              </div>

              <div className="border-t sm:border-t-0 sm:border-l border-dashed border-line bg-cream p-[clamp(18px,2.5vw,20px)] flex sm:flex-col items-center sm:items-start gap-3 flex-wrap">
                <span
                  className={`self-start text-[11.5px] font-bold px-2.5 py-1 rounded-md ${
                    firstTry ? "bg-success-bg text-success-deep" : "bg-[var(--tint-amber)] text-amber"
                  }`}
                >
                  {firstTry ? t("naturalBadge") : t("needsFix")}
                </span>
                <div className="text-[30px] font-extrabold tracking-[-0.03em] leading-none tabular-nums">
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

      <div className="rounded-[16px] p-5 border bg-success-bg border-success-line">
        <h3 className="text-xs font-extrabold tracking-[.1em] uppercase text-success-deep flex items-center gap-2 mb-3.5">
          {t("focusTitle")}
        </h3>
        <p className="text-[19px] font-extrabold tracking-[-0.02em] leading-[1.35] text-success-deep" style={{ textWrap: "balance" }}>
          {practicedCount === 0 ? t("fallbackFocusPerfect") : t("fallbackFocusRetries")}
        </p>
        {prompts[0]?.example_kr && (
          <div className="mt-3.5 px-3.5 py-3 bg-cream border border-success-line rounded-[10px]">
            <span className={`${LABEL} block mb-1`}>{t("tryIt")}</span>
            <p className="kr text-[15px] leading-[1.7]">{prompts[0].example_kr}</p>
          </div>
        )}
        <p className="text-[12.5px] text-success font-semibold mt-3">{t("nextChapterChecks")}</p>
      </div>

      <div className="flex items-center justify-end gap-2.5 flex-wrap">
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
      </div>
    </div>
  );
}
