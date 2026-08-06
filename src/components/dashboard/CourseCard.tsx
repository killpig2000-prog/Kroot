"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COURSE_TOTAL_DAYS } from "@/lib/course";

// "Today's session" entry card for the 16-day course. One CTA, no browsing:
// the next unfinished day is chosen for you. Dismissable like the old PathCard.
export default function CourseCard({
  userId,
  nextDay,
  nextTitle,
  nextTitleKr,
  nextMinutes,
  doneDays,
}: {
  userId: string;
  nextDay: number;
  nextTitle: string;
  nextTitleKr: string;
  nextMinutes: number;
  doneDays: number[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [hidden, setHidden] = useState(false);

  async function hide() {
    setHidden(true);
    await supabase.from("profiles").update({ path_hidden: true }).eq("id", userId);
  }

  if (hidden) return null;

  const doneSet = new Set(doneDays);

  return (
    <div className="relative border border-[#ECD98A] bg-[#FEF9C3] px-5 py-[18px] mb-[30px] rotate-[0.4deg] shadow-[0_12px_24px_-14px_rgba(120,100,30,.4)]">
      <span aria-hidden="true" className="absolute -top-2 right-14 rotate-2 w-[50px] h-[16px] border z-10" style={{ background: "rgba(251,207,232,.6)", borderColor: "rgba(230,150,190,.45)" }} />
      <button
        onClick={hide}
        title="Hide — resume anytime at /course"
        aria-label="Hide course card"
        className="absolute top-2.5 right-2.5 w-[26px] h-[26px] rounded-lg text-[13px] text-[#A19A8C] hover:bg-white hover:text-[#18181B] transition-colors"
      >
        ✕
      </button>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-[220px]">
          <p className="text-[11px] font-extrabold tracking-[.08em] uppercase text-[#A16207] mb-0.5">
            📌 Day {nextDay} of {COURSE_TOTAL_DAYS} · Hangul 7 days + Grammar 9 days
          </p>
          <b className="block font-bold text-[15.5px] tracking-[-0.01em]">
            Today: <span className="kr">{nextTitleKr}</span>
          </b>
          <span className="text-[12.5px] text-[#6B6560]">
            {nextTitle} · ~{nextMinutes} min, hands-free
          </span>
          <div className="flex gap-1 mt-2.5 flex-wrap" aria-hidden="true">
            {Array.from({ length: COURSE_TOTAL_DAYS }, (_, i) => {
              const d = i + 1;
              const cls = doneSet.has(d)
                ? "bg-[#16A34A]"
                : d === nextDay
                  ? "bg-[#FF9E7D]"
                  : "bg-[#E8D9A0]";
              return <span key={d} className={`w-[18px] h-[5px] rounded-full ${cls}`} />;
            })}
          </div>
        </div>

        <Link
          href="/course"
          className="flex-none bg-[#16A34A] text-white rounded-[9px] px-[18px] py-2.5 text-[13.5px] font-bold shadow-[0_4px_0_#15803D] hover:translate-y-[2px] hover:shadow-[0_2px_0_#15803D] transition-all"
        >
          Open course →
        </Link>
      </div>
    </div>
  );
}
