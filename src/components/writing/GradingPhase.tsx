import { useTranslations } from "next-intl";
import LevelCreature from "@/components/dashboard/LevelCreature";
import type { CefrLevel } from "@/lib/tree";

const CARD = "border border-line rounded-[14px] bg-cream max-w-[900px]";

// Cycled every ~3.2s while grading is in flight (a real 5-15s API round
// trip) so a slow check reads as "still working" instead of "stuck".
const GRADING_STEP_KEYS = [
  ["step1Title", "step1Sub"],
  ["step2Title", "step2Sub"],
  ["step3Title", "step3Sub"],
] as const;

export default function GradingPhase({
  gradingStep,
  treeStage,
  species,
  costumeIds,
  responses,
}: {
  gradingStep: number;
  treeStage: CefrLevel;
  species?: CefrLevel;
  costumeIds?: string[];
  /** What the learner submitted — shown while they wait so it doesn't vanish. */
  responses?: string[];
}) {
  const t = useTranslations("writing.grading");
  const [titleKey, subtitleKey] = GRADING_STEP_KEYS[Math.min(gradingStep, GRADING_STEP_KEYS.length - 1)];
  return (
    <div className={`${CARD} px-7 py-10 text-center`} style={{ animation: "fadeUp .35s ease" }}>
      <svg viewBox="0 0 220 230" className="w-[180px] h-auto mx-auto" aria-hidden="true">
        <g className="sway">
          <LevelCreature level={treeStage} species={species} costumeIds={costumeIds} />
        </g>
      </svg>
      <h2 key={titleKey} className="font-bold text-[19px] tracking-[-0.02em] mt-3 mb-1.5" style={{ animation: "fadeUp .3s ease" }}>
        {t(titleKey)}
      </h2>
      <p key={subtitleKey} className="text-sm text-muted" style={{ animation: "fadeUp .3s ease" }}>
        {t(subtitleKey)}
      </p>
      {gradingStep >= GRADING_STEP_KEYS.length - 1 && <p className="text-[12.5px] text-faint mt-4">{t("slow")}</p>}
      {responses && responses.some((r) => r.trim()) && (
        <div className="mt-6 max-w-[560px] mx-auto text-left bg-warm border border-line rounded-[12px] px-4 py-3 flex flex-col gap-2.5">
          <p className="text-[10.5px] font-semibold tracking-[.08em] uppercase text-faint">{t("yourAnswers")}</p>
          {responses.map(
            (r, i) =>
              r.trim() && (
                <p key={i} className="kr text-[14px] leading-[1.6] whitespace-pre-wrap">
                  <b className="text-faint font-semibold">Q{i + 1}.</b> {r.trim()}
                </p>
              )
          )}
        </div>
      )}
    </div>
  );
}
