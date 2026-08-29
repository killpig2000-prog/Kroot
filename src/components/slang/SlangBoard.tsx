"use client";

import { useEffect, useMemo, useState } from "react";
import SlangCard from "./SlangCard";
import { VIBES, type SlangEntry, type SlangVibe } from "@/lib/slang";

// Flipping a card "collects" it — a sticker-book progress loop over the deck,
// tracked per device in localStorage.
const COLLECTED_KEY = "kroot-slang-collected";

function loadCollected(): Set<string> {
  try {
    const raw = window.localStorage.getItem(COLLECTED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export default function SlangBoard({ entries }: { entries: SlangEntry[] }) {
  const [vibe, setVibe] = useState<SlangVibe | "all">("all");
  const [collected, setCollected] = useState<Set<string>>(new Set());

  // localStorage is client-only — hydrate the collection after mount.
  useEffect(() => {
    const t = setTimeout(() => setCollected(loadCollected()), 0);
    return () => clearTimeout(t);
  }, []);

  function collect(kr: string) {
    setCollected((prev) => {
      if (prev.has(kr)) return prev;
      const next = new Set(prev);
      next.add(kr);
      try {
        window.localStorage.setItem(COLLECTED_KEY, JSON.stringify([...next]));
      } catch {
        // storage blocked — collection just won't persist
      }
      return next;
    });
  }

  const shown = useMemo(
    () => (vibe === "all" ? entries : entries.filter((e) => e.vibe === vibe)),
    [entries, vibe]
  );

  const collectedCount = entries.filter((e) => collected.has(e.kr)).length;

  const chip = (active: boolean) =>
    `rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
      active
        ? "bg-[#C13E78] border-[#C13E78] text-white"
        : "bg-cream border-line text-muted hover:border-faint"
    }`;

  return (
    <>
      {/* sticker-book progress */}
      <div className="flex items-center gap-3 mb-4 max-w-[420px]">
        <span className="text-[13px] font-bold text-[#C13E78] flex-none tabular-nums">
          🃏 {collectedCount}/{entries.length} collected
        </span>
        <span className="flex-1 h-1.5 rounded-full bg-[#FDF2F8] border border-[#FBCFE8] overflow-hidden">
          <span
            className="block h-full bg-[#C13E78] rounded-full transition-all"
            style={{ width: `${entries.length ? (collectedCount / entries.length) * 100 : 0}%` }}
          />
        </span>
      </div>

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
            <SlangCard
              entry={entry}
              collected={collected.has(entry.kr)}
              onReveal={() => collect(entry.kr)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
