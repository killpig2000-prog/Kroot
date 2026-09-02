import { getTranslations } from "next-intl/server";
import { PRACTICE_SKILLS } from "./skill-progress";

// "Practice mix" — share of XP earned per skill, from xp_events.skill
// (added in migration 0024, unused by this page until now). A 100%-stacked
// bar plus a legend, using each skill's own icon colour from skill-progress —
// unlike SkillAccuracy's bars, share-of-time is a proportion of one whole, so
// colour-per-segment is the right read here, not a ranking implication.

export type SkillShare = { key: string; percent: number };

const GLYPH = new Map(PRACTICE_SKILLS.map((s) => [s.key as string, s]));

export default async function SkillMix({ shares }: { shares: SkillShare[] }) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");

  const sorted = [...shares].sort((a, b) => b.percent - a.percent);
  const top = sorted[0];

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15px]">{t("practiceMix")}</b>
        {top && (
          <small className="text-[12.5px] text-faint font-medium tabular-nums">
            {t("mostPracticed", { skill: tn(top.key), percent: top.percent })}
          </small>
        )}
      </div>

      <div className="flex w-full h-[14px] rounded-full overflow-hidden border border-line bg-chart-dim">
        {sorted.map((s) => {
          const g = GLYPH.get(s.key);
          return (
            <span
              key={s.key}
              style={{ width: `${s.percent}%`, background: g?.color ?? "var(--c-chart)" }}
              className="h-full first:rounded-l-full last:rounded-r-full"
              title={`${tn(s.key)} · ${s.percent}%`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 mt-4">
        {sorted.map((s) => {
          const g = GLYPH.get(s.key);
          return (
            <div key={s.key} className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-[3px] flex-none" style={{ background: g?.color ?? "var(--c-chart)" }} />
              <span className="text-[12.5px] font-medium truncate flex-1">{tn(s.key)}</span>
              <span className="text-[12.5px] font-semibold tabular-nums text-muted flex-none">{s.percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
