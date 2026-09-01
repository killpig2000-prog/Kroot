"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useBackToClose } from "@/hooks/useBackToClose";
import type { SearchEntry } from "@/lib/vocab-search-index";

const MAX_RESULTS = 8;

// "Where did I see that word again?" — instant search over the whole deck,
// jumping straight into the unit that teaches it, regardless of the
// searcher's own level: looking a word up is not the same as the guided
// level-by-level progression on the main page, so search results are never
// locked (unlike the level tabs).
//
// Lives behind a small trigger rather than a full-width bar: the index page
// is a table of contents, and a big search box between the title and the
// contents made it read as a search page first. Press "/" to open it.
export default function VocabSearch() {
  const t = useTranslations("vocabulary");
  const tu = useTranslations("ui");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const loading = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function ensureIndex() {
    if (index || loading.current) return;
    loading.current = true;
    const mod = await import("@/lib/vocab-search-index");
    setIndex(mod.SEARCH_INDEX);
  }

  function show() {
    setOpen(true);
    void ensureIndex();
  }

  function hide() {
    setOpen(false);
    setQuery("");
  }

  // Escape closes it on a keyboard; Back does the same on a phone.
  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);
  useBackToClose(open, close);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hide();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // "/" opens search from anywhere on the page, unless you're already typing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      show();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = query.trim().toLowerCase();
  const results =
    q && index
      ? index
          .filter((e) => e.kr.includes(q) || e.roman.includes(q) || e.en.includes(q))
          .slice(0, MAX_RESULTS)
      : [];

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3 py-1 text-[12.5px] font-semibold text-muted hover:text-charcoal hover:border-faint transition-colors"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span aria-hidden="true" className="text-[13px] opacity-70">🔍</span>
        {t("search.trigger")}
        <kbd
          aria-hidden="true"
          className="hidden sm:inline-block ml-1 rounded-[5px] border border-line bg-warm px-1.5 text-[10.5px] font-bold text-faint leading-[16px]"
        >
          /
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[clamp(24px,12vh,120px)] bg-[#282319]/35"
          onClick={hide}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("search.dialogLabel")}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] bg-cream border border-line rounded-[14px] shadow-[0_24px_60px_-24px_rgba(60,50,30,.55)] overflow-hidden"
            style={{ animation: "fadeUp .18s ease" }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
              <span aria-hidden="true" className="text-[15px] opacity-60">🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 min-w-0 bg-transparent text-[15px] outline-none placeholder:text-faint"
                aria-label={t("search.dialogLabel")}
              />
              <button
                type="button"
                onClick={hide}
                aria-label={tu("closeSearch")}
                className="text-[13px] text-faint hover:text-charcoal transition-colors"
              >
                ✕
              </button>
            </div>

            {!q ? (
              <p className="px-4 py-3 text-[12.5px] text-faint">
                {t("search.hint")}
              </p>
            ) : !index ? (
              <p className="px-4 py-3 text-[13px] text-faint">{t("search.loading")}</p>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-[13px] text-faint">
                {t("search.noMatch", { query: query.trim() })}
              </p>
            ) : (
              results.map((r) => (
                <Link
                  key={`${r.level}:${r.kr}:${r.chapter}`}
                  href={`/vocabulary/daily-life/session?chapter=${r.chapter}&level=${r.level}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-t border-line first:border-t-0 hover:bg-success-bg transition-colors"
                  onClick={hide}
                >
                  <span className="kr flex-none font-bold text-[15px] min-w-[72px]">{r.kr}</span>
                  <span className="flex-1 min-w-0 text-[12.5px] text-muted truncate">{r.en}</span>
                  <span className="flex-none text-[11.5px] text-faint">
                    {r.level} · {t("unitN", { n: r.chapter + 1 })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
