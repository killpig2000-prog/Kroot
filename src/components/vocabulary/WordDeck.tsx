"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buttonClassName } from "@/components/ui/Button";
import WordDetailCard, { DayResult, type DayResultData, type DetailWord } from "@/components/vocabulary/WordDetailCard";

// A Day's words side by side (2026-09-13, user call, after the slang deck):
// the ten cards sit in one row that scrolls sideways and snaps a card at a
// time — swipe on a phone, trackpad or Shift+wheel on a computer, ← → keys,
// or the ‹ › beside the dots. Moving between words used to be a page load per
// word (the tree loader flashed every time); now it never leaves the page.
// The card itself is unchanged apart from losing its ruled paper, and there
// is no flip. The URL's `i` follows the card in view, so a reload or a
// shared link lands on the same word.
//
// The deck owns what the ten cards share: which words are answered (the
// Day's progress, and what tells the last card it finishes the Day), the
// word-bank count, and the Day's result screen.

export type DeckWord = {
  word: DetailWord;
  correctCount: number;
  incorrectCount: number;
  box: number;
  inBank: boolean;
};

const HINT_SEEN_KEY = "kroot-vocab-swiped";

export default function WordDeck({
  words,
  startIndex,
  locale,
  userId,
  level,
  savedCount: initialSavedCount,
  slots,
  unitHref,
  topicKey,
  dayIndex,
  hasNextDay,
}: {
  words: DeckWord[];
  startIndex: number;
  locale: string;
  userId: string;
  level: string;
  savedCount: number;
  slots: number;
  unitHref: string;
  topicKey: string;
  dayIndex: number;
  hasNextDay: boolean;
}) {
  const t = useTranslations("vocabulary");
  const stripRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const [index, setIndex] = useState(startIndex);
  const indexRef = useRef(startIndex);
  // Scroll events from the deck placing itself on the start word aren't the
  // learner moving — they mustn't retire the swipe hint.
  const settledRef = useRef(false);
  const [rated, setRated] = useState(() =>
    words.map((w) => ({ answered: w.correctCount + w.incorrectCount > 0, gotIt: w.box > 1 }))
  );
  const [savedCount, setSavedCount] = useState(initialSavedCount);
  const [result, setResult] = useState<DayResultData | null>(null);
  const total = words.length;

  const slotEls = useCallback(
    () => Array.from(stripRef.current?.querySelectorAll<HTMLElement>("[data-slot]") ?? []),
    []
  );

  const go = useCallback(
    (n: number, smooth = true) => {
      const strip = stripRef.current;
      const slot = slotEls()[Math.max(0, Math.min(total - 1, n))];
      if (!strip || !slot) return;
      const pad = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      strip.scrollTo({ left: slot.offsetLeft - pad, behavior: smooth && !reduce ? "smooth" : "auto" });
    },
    [slotEls, total]
  );

  // Land on the word the URL names, then show the swipe hint to anyone who
  // hasn't swiped a deck yet.
  useEffect(() => {
    go(startIndex, false);
    const id = requestAnimationFrame(() => {
      settledRef.current = true;
    });
    try {
      if (hintRef.current && !localStorage.getItem(HINT_SEEN_KEY)) hintRef.current.hidden = false;
    } catch {
      // storage blocked: the hint just stays hidden
    }
    return () => cancelAnimationFrame(id);
  }, [go, startIndex]);

  useEffect(() => {
    indexRef.current = index;
    const url = new URL(window.location.href);
    if (url.searchParams.get("i") === String(index)) return;
    url.searchParams.set("i", String(index));
    window.history.replaceState(null, "", url);
  }, [index]);

  function onScroll() {
    const strip = stripRef.current;
    if (!strip) return;
    const pad = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
    let best = 0;
    let bestDist = Infinity;
    slotEls().forEach((el, k) => {
      const d = Math.abs(el.offsetLeft - pad - strip.scrollLeft);
      if (d < bestDist) {
        bestDist = d;
        best = k;
      }
    });
    if (best === indexRef.current) return;
    setIndex(best);
    if (settledRef.current && hintRef.current && !hintRef.current.hidden) {
      hintRef.current.hidden = true;
      try {
        localStorage.setItem(HINT_SEEN_KEY, "1");
      } catch {
        // storage blocked: the hint comes back next visit, harmless
      }
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select, [contenteditable='true']")) return;
      // An open sheet (trace paper, the lesson bar's language picker) keeps
      // its own keys. The lesson bar's sheet stays mounted when closed, marked
      // aria-hidden, so only an unhidden one counts.
      if (document.querySelector('[role="dialog"]:not([aria-hidden="true"])')) return;
      e.preventDefault();
      go(indexRef.current + (e.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (result) {
    return (
      <DayResult
        result={result}
        level={level}
        topicKey={topicKey}
        dayIndex={dayIndex}
        dayTotal={total}
        hasNextDay={hasNextDay}
      />
    );
  }

  const arrow =
    "w-11 h-11 flex-none rounded-full flex items-center justify-center text-[24px] leading-none text-charcoal hover:bg-cream transition-colors disabled:opacity-25 disabled:hover:bg-transparent";

  return (
    <div className="min-w-0">
      <div className="max-w-[600px] flex items-center justify-center gap-0.5 mb-1.5">
        <button type="button" className={arrow} onClick={() => go(index - 1)} disabled={index === 0} aria-label={t("detail.prevWord")}>
          ‹
        </button>
        <div className="flex items-center gap-1.5 min-w-0">
          {words.map((w, k) => (
            <span
              key={w.word.key}
              aria-hidden="true"
              className={`h-[7px] rounded-full transition-all duration-200 motion-reduce:transition-none ${
                k === index ? "w-5 bg-success" : rated[k].answered ? "w-[7px] bg-success-line" : "w-[7px] bg-line"
              }`}
            />
          ))}
          <span className="ml-2 text-[12px] text-muted tabular-nums" aria-live="polite">
            <span className="sr-only">{t("detail.wordOf", { n: index + 1, total })}</span>
            <span aria-hidden="true">
              {index + 1} / {total}
            </span>
          </span>
        </div>
        <button
          type="button"
          className={arrow}
          onClick={() => go(index + 1)}
          disabled={index === total - 1}
          aria-label={t("detail.nextWord")}
        >
          ›
        </button>
      </div>
      <p ref={hintRef} hidden className="max-w-[600px] text-center text-[12px] font-bold text-success mb-2">
        <span aria-hidden="true">← </span>
        {t("detail.swipeHint")}
      </p>

      {/* The strip reaches into the page gutter on both sides so the
          neighbouring cards peek in at the edges — the sign there's more to
          swipe to. The trailing spacer lets the last card snap to the start
          on a screen wider than one card. */}
      <div
        ref={stripRef}
        onScroll={onScroll}
        className="relative flex items-start gap-2.5 overflow-x-auto snap-x snap-mandatory overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-[clamp(18px,4vw,44px)] px-[clamp(18px,4vw,44px)] scroll-px-[clamp(18px,4vw,44px)] pt-0.5 pb-4"
      >
        {words.map((w, k) => {
          const current = k === index;
          const others = rated.filter((_, j) => j !== k);
          return (
            <div
              key={w.word.key}
              data-slot
              inert={!current}
              className={`flex-none w-[min(100%,600px)] snap-start snap-always transition-opacity duration-200 motion-reduce:transition-none ${
                current ? "" : "opacity-55"
              }`}
            >
              <WordDetailCard
                word={w.word}
                locale={locale}
                userId={userId}
                correctCount={w.correctCount}
                incorrectCount={w.incorrectCount}
                box={w.box}
                level={level}
                inBank={w.inBank}
                savedCount={savedCount}
                slots={slots}
                topicKey={topicKey}
                dayIndex={dayIndex}
                dayTotal={total}
                othersMarked={others.filter((r) => r.answered).length}
                othersGotIt={others.filter((r) => r.gotIt).length}
                hasNextDay={hasNextDay}
                active={current}
                onRated={(gotIt) =>
                  setRated((prev) => prev.map((r, j) => (j === k ? { answered: true, gotIt } : r)))
                }
                onDayResult={setResult}
                onSavedCount={setSavedCount}
              />
            </div>
          );
        })}
        <div aria-hidden="true" className="flex-none w-[max(0px,calc(100%_-_610px))]" />
      </div>

      {index === total - 1 && (
        <Link href={unitHref} className={`${buttonClassName("line")} max-w-[600px] w-full justify-center`}>
          {t("detail.backToChapter")}
        </Link>
      )}
    </div>
  );
}
