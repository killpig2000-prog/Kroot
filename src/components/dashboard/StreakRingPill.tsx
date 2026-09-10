"use client";

import { useEffect, useState } from "react";
import GrowthRing from "@/components/dashboard/GrowthRing";
import type { DayDepth } from "@/lib/growth-rings";

// The phone status bar's streak pill, with this week's growth ring where
// the flame was (2026-09-10). The number is still the streak; the ring is
// the week — seven segments, today's filled the first time the Garden
// opens that day. It listens for that moment (GrowthRingsCard fires
// `kroot:attendance` after the server confirms the first open) and answers
// with a soft pulse and a green mark on today's segment, so the two rings
// on the screen agree without a second request.
export const ATTENDANCE_EVENT = "kroot:attendance";

export default function StreakRingPill({
  week,
  today,
  streakDays,
  label,
}: {
  week: DayDepth[];
  today: number;
  streakDays: number;
  label: string;
}) {
  const [days, setDays] = useState(week);
  const [lit, setLit] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const onFirst = () => {
      setDays((d) => d.map((v, i) => (i === today && v < 1 ? 1 : v)) as DayDepth[]);
      setLit(true);
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    };
    window.addEventListener(ATTENDANCE_EVENT, onFirst);
    return () => window.removeEventListener(ATTENDANCE_EVENT, onFirst);
  }, [today]);

  return (
    <span
      aria-label={label}
      className={`flex items-center gap-1.5 h-8 pl-2 pr-2.5 rounded-full border border-[#ECD98A] bg-[#FEF9C3] text-[#5C4A0E] text-[12.5px] font-bold tabular-nums transition-shadow duration-700 ${
        pulse ? "shadow-[0_0_0_6px_rgba(62,124,89,.22)]" : "shadow-[0_0_0_0_rgba(62,124,89,0)]"
      }`}
    >
      <GrowthRing week={days} today={today} ring="icon" markToday={lit} className="w-[18px] h-[18px] flex-none" />
      {streakDays}
    </span>
  );
}
