import { getFormatter, getTranslations } from "next-intl/server";

// "Your weekly rhythm" — total minutes studied grouped by day of week
// (Mon..Sun), from the same daily_activity rows StudyDays already reads.
// New analysis added 2026-09-02: the 30-day timeline shows *when* recently,
// this shows *which weekday* the learner actually shows up on, across every
// day on record.

export type WeekdayMinutes = { dow: number; minutes: number }; // 7 entries, Mon..Sun order, dow = JS getUTCDay()

const SLOT = 40;
const BAR_W = 18;
const H = 72;
const STUB = 3;

/** 2024-01-01 was a Monday, so dow 1..6 map to Jan 1..6 and dow 0 (Sunday) to Jan 7. */
function weekdayLabel(dow: number, format: Awaited<ReturnType<typeof getFormatter>>): string {
  const day = dow === 0 ? 7 : dow;
  return format.dateTime(new Date(Date.UTC(2024, 0, day)), { weekday: "short" });
}

export default async function WeekdayPattern({ days }: { days: WeekdayMinutes[] }) {
  const t = await getTranslations("ui.account");
  const format = await getFormatter();

  const hasData = days.some((d) => d.minutes > 0);
  const max = Math.max(...days.map((d) => d.minutes), 1);
  const peak = days.reduce((best, d) => (d.minutes > best.minutes ? d : best), days[0]);

  return (
    <div className="border border-line rounded-[14px] bg-cream px-[22px] py-5">
      <div className="flex items-baseline justify-between gap-3 mb-3.5 flex-wrap">
        <b className="font-semibold text-[15px]">{t("weekdayPattern")}</b>
        {hasData && (
          <small className="text-[12.5px] text-faint font-medium">
            {t("busiestOn", { day: weekdayLabel(peak.dow, format) })}
          </small>
        )}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${days.length * SLOT} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-[72px] min-w-[240px] block"
          role="img"
          aria-label={t("weekdayPattern")}
        >
          {days.map((d, i) => {
            const h = d.minutes > 0 ? Math.max(STUB, Math.round((d.minutes / max) * H)) : STUB;
            const isPeak = hasData && d.dow === peak.dow;
            return (
              <rect
                key={d.dow}
                x={i * SLOT + (SLOT - BAR_W) / 2}
                y={H - h}
                width={BAR_W}
                height={h}
                rx={5}
                fill={d.minutes > 0 ? "var(--c-chart)" : "var(--c-chart-dim)"}
                opacity={d.minutes > 0 && !isPeak ? 0.5 : 1}
              >
                <title>{t("tooltipMinutes", { date: weekdayLabel(d.dow, format), count: d.minutes })}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {days.map((d) => (
          <small key={d.dow} className="text-[11px] text-faint text-center tabular-nums">
            {weekdayLabel(d.dow, format)}
          </small>
        ))}
      </div>
    </div>
  );
}
