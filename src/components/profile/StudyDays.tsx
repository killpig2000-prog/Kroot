import { getTranslations } from "next-intl/server";

// "When you study" — 30 days of daily minutes, drawn as inline SVG (no chart
// library). A day with no study is a short grey stub rather than a gap, so
// the row keeps a steady rhythm and missed days stay visible instead of
// silently closing up.

export type StudyDay = { date: string; minutes: number };

const DAYS = 30;
const SLOT = 10; // 8 unit bar + 2 unit gutter
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

      {/* the SVG always scales to the card width via viewBox — no min-width,
          so narrow phones shrink the bars instead of clipping them behind
          an unhinted horizontal scroll */}
      <div>
        <svg
          viewBox={`0 0 ${DAYS * SLOT} ${H}`}
          preserveAspectRatio="none"
          className="w-full h-[64px] block"
          role="img"
          aria-label={t("whenYouStudy")}
        >
          {/* same blue→teal gradient as the admin funnel bars, applied
              top-to-bottom instead of left-to-right */}
          <defs>
            <linearGradient id="studyDaysBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--c-sky-deep)" />
              <stop offset="100%" stopColor="var(--c-teal)" />
            </linearGradient>
          </defs>
          {days.map((d, i) => {
            const h = d.minutes > 0 ? Math.max(STUB, Math.round((d.minutes / max) * H)) : STUB;
            return (
              <rect
                key={d.date}
                x={i * SLOT}
                y={H - h}
                width={SLOT - 2}
                height={h}
                rx={3}
                fill={d.minutes > 0 ? "url(#studyDaysBar)" : "var(--c-chart-dim)"}
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
