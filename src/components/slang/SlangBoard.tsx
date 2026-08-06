"use client";

import { useMemo, useState } from "react";
import SlangCard from "./SlangCard";
import { VIBES, type SlangEntry, type SlangVibe } from "@/lib/slang";

export default function SlangBoard({ entries }: { entries: SlangEntry[] }) {
  const [vibe, setVibe] = useState<SlangVibe | "all">("all");

  const shown = useMemo(
    () => (vibe === "all" ? entries : entries.filter((e) => e.vibe === vibe)),
    [entries, vibe]
  );

  const chip = (active: boolean) =>
    `rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
      active
        ? "bg-[#DB2777] border-[#DB2777] text-white"
        : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
    }`;

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button type="button" onClick={() => setVibe("all")} className={chip(vibe === "all")}>
          All {entries.length}
        </button>
        {VIBES.map((v) => {
          const count = entries.filter((e) => e.vibe === v.key).length;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => setVibe(v.key)}
              className={chip(vibe === v.key)}
            >
              {v.emoji} {v.label} {count}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 max-w-[980px]">
        {shown.map((entry) => (
          <div key={entry.kr} style={{ animation: "fadeUp .3s ease" }}>
            <SlangCard entry={entry} />
          </div>
        ))}
      </div>
    </>
  );
}
