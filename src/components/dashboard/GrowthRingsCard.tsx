"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import GrowthRing from "@/components/dashboard/GrowthRing";
import BottomSheet from "@/components/settings/BottomSheet";
import { ATTENDANCE_EVENT } from "@/components/dashboard/StreakRingPill";
import { TONE, type DayDepth, type WeekRing } from "@/lib/growth-rings";

// Growth rings — the phone Garden's last card (2026-09-10, user call),
// where the week chart sat. The ring is this week; the four faint bands
// inside it are the four weeks before. Tapping opens the twelve-week
// cross-section with a row per week.
//
// The first open of the day is the card's one moment: it asks
// /api/attendance, and when the server says this was the first, today's
// segment draws itself in, a short toast names the day, and the status
// bar's pill is told so it can pulse. A second open the same day gets
// `first: false` and nothing moves — no nudge, no badge, no red.

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

export default function GrowthRingsCard({
  weeks,
  today,
  todayIso,
  avgPerDay,
  streakDays,
  level = 0,
}: {
  /** newest first; [0] is the current week */
  weeks: WeekRing[];
  /** 0 = Monday … 6 = Sunday */
  today: number;
  todayIso: string;
  avgPerDay: number;
  streakDays: number;
  /** the tree's level — decides the heartwood colour */
  level?: number;
}) {
  const t = useTranslations("dashboard.rings");
  const format = useFormatter();
  const [week, setWeek] = useState<DayDepth[]>(weeks[0]?.days ?? [0, 0, 0, 0, 0, 0, 0]);
  const [first, setFirst] = useState(false);
  const [toast, setToast] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/attendance", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { first?: boolean } | null) => {
        if (!alive || !j?.first) return;
        setWeek((d) => d.map((v, i) => (i === today && v < 1 ? 1 : v)) as DayDepth[]);
        setFirst(true);
        setToast(true);
        window.dispatchEvent(new CustomEvent(ATTENDANCE_EVENT));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [today]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(false), 3400);
    return () => clearTimeout(id);
  }, [toast]);

  const attended = week.filter((d) => d > 0).length;
  const grown = weeks.filter((w) => w.attended > 0).length;
  const past = weeks.slice(1);
  const dayName = format.dateTime(new Date(`${todayIso}T12:00:00`), { weekday: "long" });
  // Mon..Sun of a ring as "Sep 1 – 7" in the viewer's locale; noon keeps
  // the date stable across time zones the way dayName does.
  const weekLabel = (monday: string) => {
    const a = new Date(`${monday}T12:00:00`);
    const b = new Date(a);
    b.setDate(a.getDate() + 6);
    return format.dateTimeRange(a, b, { month: "short", day: "numeric" });
  };
  const legend: { depth: DayDepth; key: "legendAway" | "legendShowed" | "legendLesson" | "legendReview" }[] = [
    { depth: 0, key: "legendAway" },
    { depth: 1, key: "legendShowed" },
    { depth: 2, key: "legendLesson" },
    { depth: 3, key: "legendReview" },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("open")}
        className="w-full text-left border border-line rounded-[14px] bg-cream px-4 py-3 flex items-center gap-3.5 shadow-[0_2px_0_var(--c-line)] transition-[transform,box-shadow] duration-100 active:translate-y-[2px] active:shadow-[0_0_0_var(--c-line)]"
      >
        {/* A picture, so clamp()ed: fits 360, stops growing by 430. */}
        <GrowthRing
          week={week}
          today={today}
          past={past.slice(0, 4)}
          level={level}
          ring="card"
          animateToday={first}
          markToday={first}
          className="flex-none"
          style={{ width: "clamp(60px, 16vw, 68px)", height: "clamp(60px, 16vw, 68px)" }}
          label={t("ariaWeek", { n: attended })}
        />
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <b className="text-[14.5px] font-bold text-success-deep">{t("title")}</b>
          <span className="text-[12.5px] text-muted tabular-nums">
            {t("thisWeek", { n: attended })} · {t("avgPerDay", { n: avgPerDay })}
          </span>
          <span className="flex gap-1 mt-0.5" aria-hidden="true">
            {week.map((v, i) => (
              <i
                key={i}
                className={`not-italic w-5 h-5 rounded-[6px] grid place-items-center text-[10px] font-extrabold ${
                  v === 0 ? "text-faint" : v === 1 ? "text-[#5C4A0E]" : "text-cream"
                } ${i === today ? "outline outline-2 outline-offset-1 outline-success" : ""}`}
                style={{ background: TONE[v] }}
              >
                {DAY_LETTERS[i]}
              </i>
            ))}
          </span>
        </span>
      </button>

      {toast && (
        <div
          role="status"
          className="fixed left-4 right-4 top-[60px] z-40 xl:hidden flex items-center gap-2.5 rounded-[12px] border border-success-line bg-cream px-3 py-2.5 shadow-[0_2px_0_var(--c-success-line),0_10px_24px_-16px_rgba(46,91,65,.5)]"
          style={{ animation: "fadeUp .25s ease" }}
        >
          <GrowthRing week={week} today={today} ring="card" animateToday className="w-8 h-8 flex-none" />
          <span className="min-w-0">
            <b className="block text-[13.5px] font-bold text-success-deep">{t("toastTitle", { day: dayName })}</b>
            <span className="block text-[12px] text-muted tabular-nums">{t("toastSub", { n: attended, streak: streakDays })}</span>
          </span>
        </div>
      )}

      <BottomSheet open={open} onClose={() => setOpen(false)} title={t("sheetTitle", { n: weeks.length })}>
        <div className="px-3 pb-2 flex flex-col gap-3">
          <div className="flex justify-center py-1">
            <GrowthRing
              week={week}
              today={today}
              past={past}
              level={level}
              ring="sheet"
              markToday
              style={{ width: "clamp(176px, 50vw, 220px)", height: "clamp(176px, 50vw, 220px)" }}
              label={t("ariaWeek", { n: attended })}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
            {legend.map((l) => (
              <span key={l.key} className="flex items-center gap-1.5 text-[12px] text-muted">
                <i className="w-3.5 h-3.5 rounded-[4px] border border-line" style={{ background: TONE[l.depth] }} aria-hidden="true" />
                {t(l.key)}
              </span>
            ))}
          </div>
          <div className="border border-line rounded-[12px] overflow-hidden max-h-[34vh] overflow-y-auto">
            {weeks.map((w, i) => (
              <div key={w.start} className={`flex items-center gap-2.5 px-3 py-2 text-[12.5px] ${i ? "border-t border-line" : ""}`}>
                {/* Past rows carry their dates ("Sep 1 – 7") rather than
                    "N weeks ago" (2026-09-10, user call): the sheet reads
                    as a calendar, and a row is findable again next month. */}
                <b className="w-[108px] flex-none whitespace-nowrap font-bold text-success-deep tabular-nums">
                  {i === 0 ? t("rowThis") : weekLabel(w.start)}
                </b>
                <span className="flex gap-[3px] flex-1" aria-hidden="true">
                  {(i === 0 ? week : w.days).map((v, j) => (
                    <i key={j} className="w-3 h-3 rounded-[3px]" style={{ background: TONE[v] }} />
                  ))}
                </span>
                <span className="text-muted tabular-nums">{i === 0 ? attended : w.attended}/7</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-faint text-center">{grown > 1 ? t("grown", { n: grown }) : t("firstWeek")}</p>
        </div>
      </BottomSheet>
    </>
  );
}
