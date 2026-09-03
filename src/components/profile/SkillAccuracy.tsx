import { getTranslations } from "next-intl/server";
import { PRACTICE_SKILLS } from "./skill-progress";

// "How accurate you are" — the core card of My account (2026-08-30). It
// replaces the old Accuracy tiles and folds the retired Learning progress
// card in as the grey line under each skill name.
//
// Two rules from the design review, both load-bearing:
//  * skills are NOMINAL categories, so every bar is the same data colour;
//    grey is reserved for "no data", never for "less".
//  * a skill with no score is never drawn at 0% — it sits in its own muted
//    group below, because 0% and "not tried yet" mean opposite things.

export type SkillScore = {
  /** nav.json key, so the label matches the sidebar wording */
  key: string;
  percent: number;
  /** honest, per-metric basis: "18 of 24 right", "6 lessons", ... */
  basis: string;
  /** level progress, e.g. "5 of 150 words · A1" */
  progress: string;
};

export type SkillPending = { key: string; progress: string };

const GLYPH = new Map(PRACTICE_SKILLS.map((s) => [s.key as string, s]));

export default async function SkillAccuracy({
  scores,
  pending,
}: {
  scores: SkillScore[];
  pending: SkillPending[];
}) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");

  const sorted = [...scores].sort((a, b) => b.percent - a.percent);
  const weakestKey = sorted.length >= 2 ? sorted[sorted.length - 1].key : null;

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <b className="font-semibold text-[15px] block mb-4">{t("accuracyTitle")}</b>

      <div className="grid grid-cols-1 gap-3.5">
        {sorted.map((s) => {
          const g = GLYPH.get(s.key);
          return (
            <div key={s.key} className="flex items-center gap-3 min-w-0">
              <span
                className="w-[30px] h-[30px] rounded-lg flex-none flex items-center justify-center kr text-[13px]"
                style={g ? { background: g.bg, color: g.color } : undefined}
              >
                {g?.kr}
              </span>

              <span className="min-w-0 flex-1 sm:flex-none sm:w-[128px]">
                <b className="font-semibold text-[13px] block truncate">{tn(s.key)}</b>
              </span>

              {/* same blue→teal gradient as the "when you study" bars, left
                  to right instead of bottom to top */}
              <span className="hidden sm:block flex-1 min-w-[40px] h-[6px] rounded-full bg-chart-dim overflow-hidden">
                <i
                  className="not-italic block h-full rounded-full"
                  style={{
                    width: `${Math.max(s.percent, 2)}%`,
                    background: "linear-gradient(90deg, var(--c-sky-deep), var(--c-teal))",
                  }}
                />
              </span>

              {s.key === weakestKey && (
                <span className="flex-none text-[10.5px] font-semibold text-danger bg-danger-bg border border-line rounded-full px-2 py-[1px]">
                  {t("weakest")}
                </span>
              )}

              <span className="flex-none text-right min-w-[64px] sm:w-[92px]">
                <b className="block font-bold text-[15px] leading-tight tabular-nums">{s.percent}%</b>
                <small className="block text-[11px] text-faint tabular-nums truncate">{s.basis}</small>
              </span>
            </div>
          );
        })}
      </div>

      {pending.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-dashed border-dash">
          <small className="block text-[11.5px] text-faint mb-2">{t("notScoredYet")}</small>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {pending.map((p) => {
              const g = GLYPH.get(p.key);
              return (
                <div key={p.key} className="flex items-center gap-2.5 min-w-0 opacity-70">
                  <span className="w-[22px] h-[22px] rounded-md flex-none flex items-center justify-center kr text-[11px] bg-chart-dim text-muted">
                    {g?.kr}
                  </span>
                  <b className="font-semibold text-[12.5px] truncate">{tn(p.key)}</b>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
