import { getTranslations } from "next-intl/server";

// "By skill" — one row per skill that has a score (2026-09-07 Learn tab).
// Skills are nominal, so every bar is the one data colour; the single
// exception is the weakest skill, drawn coral so the "fill it in" row under
// the card points at something the eye already found. A skill with no data
// is not drawn at 0% — it isn't in the list at all.
export type SkillBar = { key: string; label: string; percent: number; weakest: boolean };

const CORAL = "#D4705C";

export default async function SkillBars({ rows, weakestLabel }: { rows: SkillBar[]; weakestLabel: string | null }) {
  const t = await getTranslations("profile.learn");
  return (
    <div className="border border-line rounded-[14px] bg-cream px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3 mb-2.5">
        <b className="font-semibold text-[14px]">{t("bySkill")}</b>
        {weakestLabel && <span className="text-[12.5px] text-muted">{t("weakest", { skill: weakestLabel })}</span>}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.key} className="grid grid-cols-[minmax(84px,32%)_1fr_32px] sm:grid-cols-[minmax(96px,24%)_1fr_36px] items-center gap-2.5 text-[13px]">
            <span className="truncate font-semibold">{r.label}</span>
            <span className="h-[7px] rounded-full bg-line overflow-hidden" aria-hidden="true">
              <i
                className="block h-full rounded-full not-italic"
                style={{ width: `${r.percent}%`, background: r.weakest ? CORAL : "var(--c-success)" }}
              />
            </span>
            <span className="text-right text-muted tabular-nums">{r.percent}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
