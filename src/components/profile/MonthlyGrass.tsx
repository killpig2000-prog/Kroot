// Twelve small month calendars for the current year (Jan 1 – Dec 31),
// replacing the old 53-week horizontal grass strip. Each month is a fixed
// 6x7 grid (Mon-start) so every block is the same height regardless of how
// many weeks the month actually spans — the whole year fits on one screen,
// phone included, with no horizontal scroll.
// Server component: pure markup from daily_activity data.

import { getFormatter, getTranslations } from "next-intl/server";

const CELL_COLORS = ["bg-[#F0EFED]", "bg-[#BBF7D0]", "bg-[#6BBF8A]", "bg-[#3E7C59]", "bg-[#2E5B41]"];
const LEGEND_COLORS = ["#F0EFED", "#BBF7D0", "#6BBF8A", "#3E7C59", "#2E5B41"];

function level(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 1;
  if (minutes < 20) return 2;
  if (minutes < 40) return 3;
  return 4;
}

export default async function MonthlyGrass({
  minutesByDate,
  headline,
}: {
  minutesByDate: Map<string, number>;
  headline: { label: string; value: string }[];
}) {
  const t = await getTranslations("profile.grass");
  const format = await getFormatter();
  const today = new Date();
  const year = today.getFullYear();
  const todayIso = today.toISOString().slice(0, 10);

  type Cell = { date: string; day: number; minutes: number; future: boolean } | null;

  const months = Array.from({ length: 12 }, (_, mo) => {
    const first = new Date(year, mo, 1);
    const daysInMonth = new Date(year, mo + 1, 0).getDate();
    const leadBlanks = (first.getDay() + 6) % 7; // Monday-start offset
    const cells: Cell[] = Array.from({ length: leadBlanks }, () => null);
    let total = 0;
    let anyPast = false;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, mo, d);
      const iso = date.toISOString().slice(0, 10);
      const future = date > today;
      const minutes = minutesByDate.get(iso) ?? 0;
      if (!future) {
        total += minutes;
        anyPast = true;
      }
      cells.push({ date: iso, day: d, minutes, future });
    }
    while (cells.length < 42) cells.push(null);
    return {
      mo,
      label: format.dateTime(new Date(Date.UTC(year, mo, 15)), { month: "short", timeZone: "UTC" }),
      total,
      anyPast,
      cells,
      isCurrent: mo === today.getMonth(),
    };
  });

  return (
    <div className="border border-line rounded-[14px] px-[22px] py-5">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <b className="font-semibold text-[15px]">{t("title", { year: String(year) })}</b>
        <div className="flex gap-2 flex-wrap">
          {headline.map((h) => (
            <span
              key={h.label}
              className="text-[12px] font-semibold text-charcoal bg-warm border border-line rounded-full px-2.5 py-[3px] tabular-nums"
            >
              {h.value} <span className="text-faint font-medium">{h.label}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="text-[12px] text-faint mb-3.5">{t("hint")}</p>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-4">
        {months.map((m) => (
          <div key={m.mo}>
            <div className="flex items-baseline justify-between mb-1 px-px">
              <span className={`text-[11px] font-bold tracking-[.02em] ${m.isCurrent ? "text-charcoal" : "text-faint"}`}>
                {m.label}
              </span>
              {m.anyPast && (
                <span className="text-[10px] text-faint tabular-nums">{t("minutesShort", { n: m.total })}</span>
              )}
            </div>
            <div className="grid grid-cols-7 gap-[2px]">
              {m.cells.map((c, i) => (
                <span
                  key={i}
                  title={c ? t("dayTitle", { date: c.date, n: c.minutes }) : undefined}
                  className={`aspect-square rounded-[2px] ${
                    !c
                      ? ""
                      : c.future
                        ? "bg-warm"
                        : `${CELL_COLORS[level(c.minutes)]} ${c.date === todayIso ? "ring-1 ring-success ring-inset" : ""}`
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-4 text-[11px] text-faint">
        {t("less")}
        {LEGEND_COLORS.map((c) => (
          <span key={c} className="w-[10px] h-[10px] rounded-[3px]" style={{ background: c }} />
        ))}
        {t("more")}
      </div>
    </div>
  );
}
