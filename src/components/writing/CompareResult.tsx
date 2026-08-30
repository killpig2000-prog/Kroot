import { useTranslations } from "next-intl";
import LevelCreature from "@/components/dashboard/LevelCreature";
import type { ProgressResult } from "@/lib/activity";
import type { Prompt } from "@/lib/writing";
import type { ChapterGradeResult } from "@/app/api/writing/grade/route";
import type { CefrLevel } from "@/lib/tree";
import { diffWordsInline } from "@/lib/word-diff";

const CARD = "border border-line rounded-[16px] bg-cream max-w-[900px] overflow-hidden";
const LABEL = "text-[11.5px] font-semibold tracking-[.1em] uppercase text-faint";
const BTN_INK =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors disabled:opacity-60";
const BTN_LINE =
  "rounded-[10px] px-5 py-[11px] text-sm font-bold text-charcoal bg-cream border border-line hover:bg-warm transition-colors disabled:opacity-60";

const CIRC = 2 * Math.PI * 70;

export default function CompareResult({
  prompts,
  responses,
  grade,
  limitMessage,
  levelUp,
  level,
  treeStage,
  species,
  costumeIds,
  chapterIndex,
  hasNextChapter,
  navigating,
  onGoTo,
}: {
  prompts: Prompt[];
  responses: string[];
  grade: ChapterGradeResult | null;
  limitMessage: string | null;
  levelUp: ProgressResult | null;
  level: CefrLevel;
  treeStage: CefrLevel;
  species?: CefrLevel;
  costumeIds?: string[];
  chapterIndex: number;
  hasNextChapter: boolean;
  navigating: boolean;
  onGoTo: (href: string) => void;
}) {
  const t = useTranslations("writing.result");
  const naturalCount = grade?.answers.filter((a) => a.original === a.corrected).length ?? 0;
  const fixCount = (grade?.answers.length ?? 0) - naturalCount;
  const offset = grade ? CIRC - (Math.max(0, Math.min(100, grade.score)) / 100) * CIRC : CIRC;
  const headline = grade
    ? grade.score >= 90
      ? t("headline90")
      : grade.score >= 80
        ? t("headline80")
        : grade.score >= 60
          ? t("headline60")
          : t("headlineLow")
    : "";

  return (
    <div className="flex flex-col gap-3.5" style={{ animation: "fadeUp .4s ease" }}>
      {/* limit / no-grade notice */}
      {limitMessage && (
        <div className={`${CARD} px-5 py-4 flex items-center gap-3`}>
          <span className="text-2xl">🛠️</span>
          <p className="text-sm text-muted">{limitMessage}</p>
        </div>
      )}

      {grade ? (
        <>
          {/* hero */}
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
                    {grade.score}
                    <small className="text-sm text-faint font-semibold">/100</small>
                  </div>
                  <div className="text-[11px] font-bold tracking-[.1em] uppercase text-muted mt-1">{t("grammar")}</div>
                </div>
              </div>

              <div className="text-center sm:text-left">
                <h2 className="font-extrabold text-[26px] sm:text-[28px] tracking-[-0.025em]" style={{ textWrap: "balance" }}>
                  {headline}
                </h2>
                <p className="text-[15px] text-muted mt-1.5 max-w-[46ch] mx-auto sm:mx-0">{grade.feedback_en}</p>
                <div className="flex gap-2 flex-wrap mt-4 justify-center sm:justify-start">
                  {naturalCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1.5 rounded-full border bg-success-bg text-success-deep border-success-line">
                      {t("natural", { n: naturalCount })}
                    </span>
                  )}
                  {fixCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold px-2.5 py-1.5 rounded-full border bg-[var(--tint-amber)] text-amber border-amber-line">
                      {t("smallFixes", { n: fixCount })}
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
                  {grade.answers.length} <em className="text-[13px] font-semibold text-success not-italic">{t("answers")}</em>
                </b>
                <span className="text-xs text-muted">{t("checkedOneGo")}</span>
              </div>
              {levelUp ? (
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
          </div>

          {/* per-answer cards */}
          <div className="flex flex-col gap-3">
            {grade.answers.map((a, i) => {
              const prompt = prompts[i];
              const isPerfect = a.original === a.corrected;
              const tokens = isPerfect ? null : diffWordsInline(a.original, a.corrected);
              return (
                <div key={i} className={`${CARD} grid grid-cols-1 sm:grid-cols-[1fr_180px]`}>
                  <div className="p-[clamp(18px,2.5vw,26px)]">
                    <div className="flex items-baseline gap-2.5 mb-3.5">
                      <span className="text-xs font-extrabold text-amber tracking-[.06em]">Q{i + 1}</span>
                      {prompt && <span className="kr text-sm font-bold text-muted">{prompt.prompt_kr}</span>}
                    </div>

                    {isPerfect ? (
                      <>
                        <p className="kr text-[17px] leading-[1.75]">{a.corrected}</p>
                        <p className="text-[13px] text-success font-semibold flex items-center gap-1.5 mt-2.5">{t("alreadyNatural")}</p>
                      </>
                    ) : (
                      <p className="kr text-[17px] leading-[1.85]">
                        {tokens!.map((t, ti) =>
                          t.type === "del" ? (
                            <del
                              key={ti}
                              className="line-through decoration-2 rounded px-[3px] mx-px bg-warm text-faint"
                            >
                              {t.text}
                            </del>
                          ) : t.type === "ins" ? (
                            <ins
                              key={ti}
                              className="no-underline font-semibold rounded px-[3px] mx-px bg-success-bg text-success-deep shadow-[inset_0_-2px_0_var(--color-success-line)]"
                            >
                              {t.text}
                            </ins>
                          ) : (
                            <span key={ti}>{t.text} </span>
                          )
                        )}
                      </p>
                    )}

                    <div className="flex gap-2 mt-3 text-[13px] text-muted leading-[1.55]">
                      <span className="flex-none w-5 h-5 rounded-[6px] bg-[var(--tint-amber)] text-amber text-[11px] font-extrabold flex items-center justify-center">
                        i
                      </span>
                      <span>{a.note}</span>
                    </div>
                  </div>

                  <div className="border-t sm:border-t-0 sm:border-l border-dashed border-line bg-cream p-[clamp(18px,2.5vw,20px)] flex sm:flex-col items-center sm:items-start gap-3 flex-wrap">
                    <span
                      className={`self-start text-[11.5px] font-bold px-2.5 py-1 rounded-md ${
                        isPerfect ? "bg-success-bg text-success-deep" : "bg-[var(--tint-amber)] text-amber"
                      }`}
                    >
                      {isPerfect ? t("naturalBadge") : t("needsFix")}
                    </span>
                    <div className="text-[30px] font-extrabold tracking-[-0.03em] leading-none tabular-nums">
                      {a.score}
                      <small className="text-xs text-faint font-semibold">/100</small>
                    </div>
                    <div className="h-1.5 rounded-full bg-line overflow-hidden flex-1 sm:w-full sm:flex-none min-w-[100px]">
                      <div
                        className="h-full rounded-full bg-success transition-all"
                        style={{ width: `${a.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* patterns + focus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grade.commonPatterns.length > 0 && (
              <div className="rounded-[16px] p-5 border bg-[var(--tint-sky)] border-sky-line">
                <h3 className="text-xs font-extrabold tracking-[.1em] uppercase text-sky-deep flex items-center gap-2 mb-3.5">
                  {t("patternsTitle")}
                </h3>
                <div className="flex flex-col">
                  {grade.commonPatterns.map((p, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-[28px_1fr] gap-2.5 py-2.5 ${
                        i > 0 ? "border-t border-sky-line" : ""
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-cream text-sky-deep border border-sky-line text-xs font-extrabold flex items-center justify-center">
                        {p.count}×
                      </span>
                      <div>
                        <b className="block text-sm">{p.label}</b>
                        <span className="text-[12.5px] text-muted">{p.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              className={`rounded-[16px] p-5 border bg-success-bg border-success-line ${
                grade.commonPatterns.length === 0 ? "sm:col-span-2" : ""
              }`}
            >
              <h3 className="text-xs font-extrabold tracking-[.1em] uppercase text-success-deep flex items-center gap-2 mb-3.5">
                {t("focusTitle")}
              </h3>
              <p className="text-[19px] font-extrabold tracking-[-0.02em] leading-[1.35] text-success-deep" style={{ textWrap: "balance" }}>
                {grade.learningPoint.headline}
              </p>
              {grade.learningPoint.example_kr && (
                <div className="mt-3.5 px-3.5 py-3 bg-cream border border-success-line rounded-[10px]">
                  <span className={`${LABEL} block mb-1`}>{t("tryIt")}</span>
                  <p className="kr text-[15px] leading-[1.7]">{grade.learningPoint.example_kr}</p>
                </div>
              )}
              <p className="text-[12.5px] text-success font-semibold mt-3">{t("nextChapterChecks")}</p>
            </div>
          </div>
        </>
      ) : (
        <div className={`${CARD} p-[clamp(20px,3vw,32px)] text-center`}>
          <svg viewBox="0 0 220 230" className="w-[140px] h-auto mx-auto" aria-hidden="true">
            <LevelCreature level={treeStage} species={species} costumeIds={costumeIds} />
          </svg>
          <h2 className="font-bold text-[19px] tracking-[-0.02em] mt-2 mb-1.5">{t("savedTitle")}</h2>
          <p className="text-sm text-muted mb-5">{t("savedBody")}</p>
          <div className="grid gap-3 max-w-[560px] mx-auto text-left">
            {prompts.map((p, i) => (
              <div key={p.key} className="rounded-[12px] border border-line bg-warm px-4 py-3">
                <p className="text-xs font-extrabold text-amber mb-1">Q{i + 1}</p>
                <p className="kr text-[15px] leading-[1.6]">{responses[i]}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
