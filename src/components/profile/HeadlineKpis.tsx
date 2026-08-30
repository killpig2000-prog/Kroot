import { getTranslations } from "next-intl/server";

// Headline + KPI row. The headline states a conclusion the numbers below
// support; with fewer than two scored skills there is no comparison to make,
// so it degrades to an honest one-liner rather than a fabricated verdict.
//
// Deliberately no "overall accuracy" tile: the per-skill numbers mix a
// correct/total rate with average 0-100 grades, and averaging those two
// kinds of number together would produce a figure that means nothing.

export type Headline =
  | { kind: "compare"; bestKey: string; worstKey: string }
  | { kind: "single"; skillKey: string }
  | null;

/** 45m / 2.6h — minutes below an hour, one decimal above. */
export function formatMinutes(total: number): { value: string; unit: "h" | "m" } {
  return total >= 60 ? { value: (total / 60).toFixed(1), unit: "h" } : { value: String(total), unit: "m" };
}

export default async function HeadlineKpis({
  headline,
  streakDays,
  totalMinutes,
  wordCount,
  activeDays,
}: {
  headline: Headline;
  streakDays: number;
  totalMinutes: number;
  wordCount: number;
  activeDays: number;
}) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");

  const studied = formatMinutes(totalMinutes);
  const perDay = activeDays > 0 ? formatMinutes(Math.round(totalMinutes / activeDays)) : null;

  const tiles: { value: string; unit?: string; label: string }[] = [
    { value: String(streakDays), label: t("kpiStreak") },
    ...(totalMinutes > 0 ? [{ value: studied.value, unit: studied.unit, label: t("kpiTime") }] : []),
    { value: String(wordCount), label: t("kpiWords") },
    ...(perDay ? [{ value: perDay.value, unit: perDay.unit, label: t("kpiPerDay") }] : []),
  ];

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      {headline && (
        <p className="text-[15px] font-semibold leading-snug mb-4 max-w-[46ch]">
          {headline.kind === "compare"
            ? t("headlineCompare", { best: tn(headline.bestKey), worst: tn(headline.worstKey) })
            : t("headlineSingle", { skill: tn(headline.skillKey) })}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="min-w-0">
            <b className="block font-bold text-[21px] leading-tight tracking-[-0.02em] tabular-nums">
              {tile.value}
              {tile.unit && <span className="text-[14px] font-semibold text-muted ml-[1px]">{tile.unit}</span>}
            </b>
            <small className="block text-[11.5px] text-faint truncate">{tile.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
