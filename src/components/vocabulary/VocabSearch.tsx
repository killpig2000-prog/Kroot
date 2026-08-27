"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getUnitTitle } from "@/lib/vocabulary";
import type { CefrLevel } from "@/lib/tree";
import type { SearchEntry } from "@/lib/vocab-search-index";

const MAX_RESULTS = 8;

// "Where did I see that word again?" — instant search over the whole deck,
// jumping straight into the unit that teaches it. The index chunk loads on
// first focus so the page bundle stays light.
export default function VocabSearch({ unlockedLevels }: { unlockedLevels: CefrLevel[] }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const loading = useRef(false);
  const unlocked = new Set(unlockedLevels);

  async function ensureIndex() {
    if (index || loading.current) return;
    loading.current = true;
    const mod = await import("@/lib/vocab-search-index");
    setIndex(mod.SEARCH_INDEX);
  }

  const q = query.trim().toLowerCase();
  const results =
    q && index
      ? index
          .filter((e) => e.kr.includes(q) || e.roman.includes(q) || e.en.includes(q))
          .slice(0, MAX_RESULTS)
      : [];

  return (
    <div className="relative mb-6">
      <div className="flex items-center gap-2.5 border border-line bg-white rounded-[12px] px-4 py-2.5 focus-within:border-success transition-colors">
        <span aria-hidden="true" className="text-[15px] opacity-60">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => void ensureIndex()}
          placeholder="Search 4,000+ words — 한국어, romanization, or English"
          className="flex-1 min-w-0 bg-transparent text-[14px] outline-none placeholder:text-faint"
          aria-label="Search vocabulary"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="text-[13px] text-faint hover:text-charcoal transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {q && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 border border-line bg-white rounded-[12px] shadow-[0_18px_40px_-24px_rgba(60,50,30,.5)] overflow-hidden">
          {!index ? (
            <p className="px-4 py-3 text-[13px] text-faint">Loading the deck…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-faint">
              No match for “{query.trim()}” — try the Korean spelling or the English meaning.
            </p>
          ) : (
            results.map((r) => {
              const open = unlocked.has(r.level);
              const inner = (
                <>
                  <span className="kr flex-none font-bold text-[15px] min-w-[72px]">{r.kr}</span>
                  <span className="flex-1 min-w-0 text-[12.5px] text-muted truncate">
                    {r.en}
                  </span>
                  <span className="flex-none text-[11.5px] text-faint">
                    {r.level} · {getUnitTitle(r.level, r.chapter)}
                    {!open && " 🔒"}
                  </span>
                </>
              );
              const key = `${r.level}:${r.kr}:${r.chapter}`;
              return open ? (
                <Link
                  key={key}
                  href={`/vocabulary/daily-life/session?chapter=${r.chapter}&level=${r.level}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-t border-[#F5F1E8] first:border-t-0 hover:bg-success-bg transition-colors"
                  onClick={() => setQuery("")}
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={key}
                  className="flex items-center gap-3 px-4 py-2.5 border-t border-[#F5F1E8] first:border-t-0 opacity-55 select-none"
                  title="Pass the promotion test to unlock this level"
                >
                  {inner}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
