"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { tokenizeKorean } from "@/lib/word-bank";
import type { Gloss } from "@/lib/word-links";

// Korean text where every word that has a vocabulary entry is marked with a
// dotted underline and opens a card on hover (tap on touch): meaning, and a
// link to the full entry. Saving happens over there, on the word page — a
// dotted underline is only ever a promise that something is there to read.
//
// The glossary is resolved on the server (lib/word-links.ts) and handed down,
// so nothing is looked up here and the 4k-word deck stays out of the bundle.

const POP_W = 232;
const POP_H = 150;
const HOVER_CLOSE_MS = 120;

// One card open at a time across every GlossedText on the page.
const closers = new Set<() => void>();

type Anchor = { token: string; gloss: Gloss; rect: DOMRect };

export default function GlossedText({
  text,
  glossary,
  className = "",
}: {
  text: string;
  glossary: Record<string, Gloss>;
  className?: string;
}) {
  const t = useTranslations("reading.gloss");
  const tokens = useMemo(() => tokenizeKorean(text), [text]);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    const close = () => setAnchor(null);
    closers.add(close);
    return () => {
      closers.delete(close);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!anchor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAnchor(null);
    };
    const onScroll = () => setAnchor(null);
    // Touch has no "leave": a tap somewhere else is how the card is dismissed.
    const onDown = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.closest("[data-gloss]")) setAnchor(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [anchor]);

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  // Leaving the word shouldn't snatch the card away before the pointer can
  // reach it — the gap between them is a few pixels tall.
  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setAnchor(null), HOVER_CLOSE_MS);
  }

  function open(el: HTMLElement, token: string, gloss: Gloss) {
    cancelClose();
    for (const close of closers) close();
    // Not tracked: this fires on every hover, which would be a beacon a second.
    setAnchor({ token, gloss, rect: el.getBoundingClientRect() });
  }

  const placeAbove = anchor
    ? anchor.rect.bottom + POP_H > window.innerHeight && anchor.rect.top > POP_H
    : false;
  const left = anchor
    ? Math.max(8, Math.min(anchor.rect.left - 10, window.innerWidth - POP_W - 8))
    : 0;
  const top = anchor ? (placeAbove ? anchor.rect.top - 6 : anchor.rect.bottom + 6) : 0;

  return (
    <span className={className}>
      {tokens.map((t, i) => {
        const gloss = t.isWord ? glossary[t.text] : undefined;
        if (!gloss) return <span key={i}>{t.text}</span>;
        const isOpen = anchor?.token === t.text;
        return (
          <button
            key={i}
            type="button"
            // Inline so a marked word never breaks the line rhythm around it.
            className={`inline cursor-pointer rounded-[3px] border-b-[1.5px] border-dotted transition-colors ${
              isOpen
                ? "border-sky-deep bg-[var(--tint-sky)]"
                : "border-sky-line hover:bg-[var(--tint-sky)]"
            }`}
            aria-label={`${gloss.korean} — ${gloss.meaning}`}
            data-gloss=""
            onClick={(e) => {
              // The line around this word toggles its translation on click.
              e.stopPropagation();
              // Never a toggle: on touch the tap also fires mouseenter, so a
              // toggle would open and shut the card in the same gesture. It
              // closes on a tap elsewhere, Escape, or scroll instead.
              open(e.currentTarget, t.text, gloss);
            }}
            onMouseEnter={(e) => open(e.currentTarget, t.text, gloss)}
            onMouseLeave={scheduleClose}
            onFocus={(e) => open(e.currentTarget, t.text, gloss)}
            onBlur={scheduleClose}
          >
            {t.text}
          </button>
        );
      })}

      {anchor &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-label={`${anchor.gloss.korean} — ${anchor.gloss.meaning}`}
            data-gloss=""
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="fixed z-[100] bg-cream border border-line rounded-[12px] shadow-[0_8px_24px_rgba(24,20,10,.12)] p-3 text-left text-charcoal"
            style={{
              left,
              top,
              width: POP_W,
              transform: placeAbove ? "translateY(-100%)" : undefined,
              animation: "fadeUp .16s ease",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="kr text-[17px] font-semibold leading-tight">{anchor.gloss.korean}</p>
                <p className="text-[11.5px] text-faint italic">{anchor.gloss.romanization}</p>
              </div>
              <span className="flex-none text-[10.5px] font-bold rounded-md px-1.5 py-px bg-warm border border-line text-muted">
                {anchor.gloss.level}
              </span>
            </div>
            <p className="text-[13.5px] mt-1.5 leading-snug">{anchor.gloss.meaning}</p>
            <Link
              href={anchor.gloss.href}
              className="mt-2.5 pt-2.5 border-t border-dashed border-line flex items-center justify-between gap-2 text-[12.5px] font-semibold text-sky-deep hover:underline"
            >
              <span>
                {t("openWordPage")}
                <small className="block font-medium text-faint text-[11px]">
                  {t("openSub", { unit: anchor.gloss.unitLabel })}
                </small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>,
          document.body
        )}
    </span>
  );
}
