import { getTranslations } from "next-intl/server";

// "When you study" — 30 days of daily minutes, drawn as inline SVG (no chart
// library). A day with no study is a short grey stub rather than a gap, so
// the row keeps a steady rhythm and missed days stay visible instead of
// silently closing up.

export type StudyDay = { date: string; minutes: number };

const DAYS = 30;
const SLOT = 10; // 6 unit bar + 4 unit gutter
const H = 64;
const STUB = 3;

export default async function StudyDays({
  days,
  streakDays,
}: {
  days: StudyDay[]; // exactly DAYS entries, oldest first
  streakDays: number;
}) {
  const t = await getTranslations("ui.account");
  const max = Math.max(...days.map((d) => d.minutes), 1);

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15px]">{t("whenYouStudy")}</b>
        <small className="text-[12.5px] text-faint font-medium tabular-nums">{t("last30Days")}</small>
      </div>

      {/* the SVG scales to the card; the wrapper only ever scrolls if the
          card is narrower than the chart's own minimum */}
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${DAYS * SLOT} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-[64px] min-w-[260px] block"
          role="img"
          aria-label={t("whenYouStudy")}
        >
          {days.map((d, i) => {
            const h = d.minutes > 0 ? Math.max(STUB, Math.round((d.minutes / max) * H)) : STUB;
            return (
              <rect
                key={d.date}
                x={i * SLOT}
                y={H - h}
                width={SLOT - 4}
                height={h}
                fill={d.minutes > 0 ? "var(--c-chart)" : "var(--c-chart-dim)"}
              >
                <title>{t("tooltipMinutes", { date: d.date, count: d.minutes })}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      <div className="flex items-baseline justify-between gap-3 mt-2">
        <small className="text-[11px] text-faint tabular-nums">{days[0]?.date}</small>
        <small className="text-[11.5px] text-faint tabular-nums">{t("streakCaption", { count: streakDays })}</small>
        <small className="text-[11px] text-faint tabular-nums">{days[days.length - 1]?.date}</small>
      </div>
    </div>
  );
}
