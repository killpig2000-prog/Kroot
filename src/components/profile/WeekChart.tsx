import { getTranslations } from "next-intl/server";

// "This week" — the Learn tab's one chart (2026-09-07 restructure). Seven
// bars, Monday..today, minutes studied per day. One series, so one data
// colour; today's bar is the deep step of the same hue (emphasis, not a
// second category). A dashed guide at 15 min gives the bars a scale without
// a full axis. Each bar carries a <title>, which is the hover tooltip.
export type WeekDay = { label: string; minutes: number; today: boolean; iso: string };

const W = 220;
const H = 74;
const BASE_Y = 58;
const TOP_Y = 14;
const GUIDE_MIN = 15;
const BAR_W = 16;

export default async function WeekChart({
  days,
  avgPerDay,
  streakDays = 0,
  bestStreak = null,
}: {
  days: WeekDay[];
  avgPerDay: number;
  /** Habit lives in this card too: the streak reads next to the week it made. */
  streakDays?: number;
  /** Only passed when the record actually beats the current run. */
  bestStreak?: number | null;
}) {
  const t = await getTranslations("profile.learn");
  const max = Math.max(GUIDE_MIN, ...days.map((d) => d.minutes));
  const y = (m: number) => BASE_Y - ((BASE_Y - TOP_Y) * m) / max;
  const slot = (W - 16) / 7;

  return (
    <div className="border border-line rounded-[14px] bg-cream px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <b className="font-semibold text-[14px]">{t("thisWeek")}</b>
        <span className="text-[12.5px] text-muted">{t("avgPerDay", { n: avgPerDay })}</span>
      </div>
      {streakDays > 0 && (
        <p className="text-[12.5px] text-muted mb-1.5 tabular-nums">
          {t("statStreakLine", { n: streakDays })}
          {bestStreak != null && <span className="text-faint"> · {t("statStreakBest", { n: bestStreak })}</span>}
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t("thisWeek")} className="block w-full h-auto">
        <line x1="8" y1={BASE_Y} x2={W - 8} y2={BASE_Y} stroke="var(--c-line)" strokeWidth="1" />
        <line x1="8" y1={y(GUIDE_MIN)} x2={W - 8} y2={y(GUIDE_MIN)} stroke="var(--c-line)" strokeWidth="1" strokeDasharray="3 4" />
        <text x="8" y={y(GUIDE_MIN) - 3} fontSize="7" fill="var(--c-muted)">
          {t("guideLabel", { n: GUIDE_MIN })}
        </text>
        {days.map((d, i) => {
          const x = 8 + slot * i + (slot - BAR_W) / 2;
          const top = d.minutes > 0 ? Math.min(y(d.minutes), BASE_Y - 2) : BASE_Y - 1;
          return (
            <g key={d.iso}>
              <rect
                x={x}
                y={top}
                width={BAR_W}
                height={BASE_Y - top}
                rx={d.minutes > 0 ? 3 : 0.5}
                fill={d.today ? "var(--c-success-deep)" : d.minutes > 0 ? "var(--c-success)" : "var(--c-line)"}
              >
                <title>{`${d.label} · ${t("minutes", { n: d.minutes })}`}</title>
              </rect>
              <text
                x={x + BAR_W / 2}
                y={H - 5}
                fontSize="7"
                textAnchor="middle"
                fill={d.today ? "var(--c-success-deep)" : "var(--c-muted)"}
                fontWeight={d.today ? 700 : 400}
              >
                {d.today ? t("today") : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
