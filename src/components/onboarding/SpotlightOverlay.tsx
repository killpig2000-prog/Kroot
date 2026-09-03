"use client";

import type { ReactNode } from "react";

// Presentational spotlight — dark scrim with a cut-out ring around one real
// element, plus a tooltip card. Shared by OnboardingTour (button-advanced)
// and GuidedStep (click-the-real-element); the footer is whatever the
// caller passes, so the two flows only differ in the buttons they hand in.
// With no rect at all (a welcome/farewell card, or a target that hasn't
// rendered yet) the scrim is solid and the card sits in the middle.
export type SpotlightRect = { top: number; left: number; width: number; height: number };

export default function SpotlightOverlay({
  rect,
  pad = 8,
  progress,
  title,
  body,
  footerLeft,
  actions,
}: {
  rect: SpotlightRect | null;
  /** Ring padding around the measured rect — smaller for compact targets like a BottomNav tab, where the default 8px overshoots the real element. */
  pad?: number;
  progress: ReactNode;
  title: string;
  body: string;
  /** Left side of the footer row — a wait hint, step dots, or nothing. */
  footerLeft?: ReactNode;
  /** Right side of the footer row — the buttons. */
  actions: ReactNode;
}) {
  const box = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const tipWidth = Math.min(300, vw - 24);
  const tipHeight = 190; // rough card height, only used to decide which side fits
  const gap = 14;
  // Below the ring when it fits; otherwise anchored by its BOTTOM edge just
  // above the ring (so a taller-than-estimated card grows upward instead of
  // sliding down over the target); otherwise — a ring taller than the
  // viewport leaves room on neither side — pinned to the top.
  let tipPos: { top?: number; bottom?: number };
  if (!box) tipPos = { top: Math.max(12, vh / 2 - tipHeight / 2) };
  else if (box.top + box.height + gap + tipHeight <= vh) tipPos = { top: box.top + box.height + gap };
  else if (box.top - gap - tipHeight >= 12) tipPos = { bottom: vh - box.top + gap };
  else tipPos = { top: 12 };
  let tipLeft = box ? box.left : vw / 2 - tipWidth / 2;
  if (tipLeft + tipWidth > vw - 12) tipLeft = vw - tipWidth - 12;
  if (tipLeft < 12) tipLeft = 12;

  return (
    // pointer-events-none on the wrapper and the scrim: the clip-path hole
    // only cuts what's *painted*, not what's *hit-tested* — without this the
    // real spotlighted element underneath (the thing the learner is
    // supposed to click) is unreachable, covered by an invisible full-screen
    // div. Only the tooltip card opts back in.
    <div className="fixed inset-0 z-[200] pointer-events-none" role="dialog" aria-modal="true" aria-label={title}>
      <div
        className="absolute inset-0 bg-black/70 transition-[clip-path] duration-300 ease-out pointer-events-none"
        style={
          box
            ? {
                clipPath: `polygon(evenodd, 0 0, 0 ${vh}px, ${vw}px ${vh}px, ${vw}px 0, 0 0, 0 0, ${box.left}px ${box.top}px, ${box.left}px ${box.top + box.height}px, ${box.left + box.width}px ${box.top + box.height}px, ${box.left + box.width}px ${box.top}px, ${box.left}px ${box.top}px)`,
              }
            : undefined
        }
      />
      {box && (
        <div
          className="absolute rounded-[12px] pointer-events-none transition-all duration-300 ease-out animate-pulse"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 3px #F4C94F",
          }}
        />
      )}

      <div
        className="absolute rounded-[14px] border border-line bg-cream p-4 shadow-2xl transition-all duration-300 ease-out pointer-events-auto"
        style={{ ...tipPos, left: tipLeft, width: tipWidth }}
      >
        <span className="block text-[11px] font-bold uppercase tracking-wide text-success-deep mb-1.5">{progress}</span>
        <h3 className="text-[17px] font-semibold text-charcoal mb-1.5">{title}</h3>
        <p className="text-[13px] leading-relaxed text-muted mb-3.5 whitespace-pre-line">{body}</p>
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0">{footerLeft}</div>
          <div className="flex items-center gap-2 flex-none">{actions}</div>
        </div>
      </div>
    </div>
  );
}

/** Pulsing "tap the highlighted spot" hint for click-gated steps. */
export function WaitHint({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-faint">
      <span className="w-1.5 h-1.5 rounded-full bg-[#F4C94F] animate-pulse flex-none" aria-hidden="true" />
      {label}
    </span>
  );
}

export const GHOST_BTN = "text-[13px] font-semibold text-muted hover:text-charcoal px-1";
export const PRIMARY_BTN =
  "rounded-[9px] bg-success px-3.5 py-2 text-[13px] font-bold text-white hover:bg-success-deep transition-colors";
