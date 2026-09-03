"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import WordStatusIcon from "@/components/vocabulary/WordStatusIcon";

export type ChapterDayWord = {
  key: string;
  href: string;
  n: number;
  korean: string;
  meaning: string;
  status: number;
  statusLabel: string;
};

export type ChapterDay = {
  index: number;
  start: number;
  end: number;
  known: number;
  total: number;
  done: boolean;
  words: ChapterDayWord[];
};

// The chapter's 50 words as five collapsible "Day" sections instead of one
// long list — Day is a display grouping only (it's the same 10-word "unit"
// sessions already run on), never a second selector next to the chapter
// chip bar above it. Only one day is open at a time.
export default function ChapterDays({
  days,
  defaultOpen,
  dayLabels,
  doneLabel,
}: {
  days: ChapterDay[];
  defaultOpen: number;
  dayLabels: string[];
  doneLabel: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      {days.map((day, i) => {
        const isOpen = open === i;
        return (
          <div key={day.index} className={`border-b border-line ${i === 0 ? "border-t" : ""}`}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-2.5 py-3.5 px-0.5 text-left"
            >
              <span className="flex items-baseline gap-2.5">
                <b className={`text-[14px] font-extrabold ${isOpen ? "text-[#6B33CC]" : "text-charcoal"}`}>
                  {dayLabels[i]}
                </b>
                <span className="text-[11.5px] text-faint tabular-nums">
                  {day.start}–{day.end}
                </span>
              </span>
              <span className="flex items-center gap-2.5">
                <span className={`text-[12px] font-bold tabular-nums ${day.done ? "text-success" : "text-muted"}`}>
                  {day.done ? doneLabel : `${day.known}/${day.total}`}
                </span>
                <span
                  className={`text-[11px] text-faint transition-transform ${isOpen ? "rotate-90 text-[#6B33CC]" : ""}`}
                  aria-hidden="true"
                >
                  ›
                </span>
              </span>
            </button>

            {isOpen && (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 pb-4">
                {day.words.map((w) => (
                  <Link
                    key={w.key}
                    href={w.href}
                    className="group grid grid-cols-[26px_22px_minmax(84px,auto)_1fr_16px] sm:grid-cols-[26px_22px_112px_1fr_16px] items-center gap-x-3 gap-y-0.5 py-2.5 border-b border-dashed border-dash hover:bg-warm transition-colors -mx-2 px-2 rounded-[6px]"
                  >
                    <span className="text-[11px] text-faint tabular-nums text-right">{w.n}</span>
                    <span title={w.statusLabel}>
                      <WordStatusIcon status={w.status} />
                    </span>
                    <span className="kr font-bold text-[17px] leading-tight">{w.korean}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold">{w.meaning}</span>
                    </span>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 16 16"
                      className="w-4 h-4 text-faint group-hover:text-charcoal group-hover:translate-x-0.5 transition-all"
                    >
                      <path
                        d="M6 3.5 10.5 8 6 12.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
