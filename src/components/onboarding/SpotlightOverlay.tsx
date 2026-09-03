"use client";

// Presentational spotlight — dark scrim with a cut-out ring around one real
// element, plus a tooltip card. Shared by GuidedStep; OnboardingTour keeps
// its own copy (its 7-step "Next"/"Get started" flow is a different shape —
// a button-advanced tour, not a click-the-real-element one).
export type SpotlightRect = { top: number; left: number; width: number; height: number };

export default function SpotlightOverlay({
  rect,
  pad = 8,
  progress,
  title,
  body,
  waitLabel,
  skipLabel,
  onSkip,
}: {
  rect: SpotlightRect | null;
  /** Ring padding around the measured rect — smaller for compact targets like a BottomNav tab, where the default 8px overshoots the real element. */
  pad?: number;
  progress: string;
  title: string;
  body: string;
  waitLabel: string;
  skipLabel: string;
  onSkip: () => void;
}) {
  const box = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const tipWidth = 300;
  let tipTop = box ? box.top + box.height + 14 : vh / 2;
  let tipLeft = box ? box.left : vw / 2 - tipWidth / 2;
  if (box && tipTop + 170 > vh) tipTop = Math.max(12, box.top - 170);
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
        className="absolute w-[300px] rounded-[14px] border border-line bg-cream p-4 shadow-2xl transition-all duration-300 ease-out pointer-events-auto"
        style={{ top: tipTop, left: tipLeft }}
      >
        <span className="block text-[11px] font-bold uppercase tracking-wide text-success-deep mb-1.5">
          {progress}
        </span>
        <h3 className="text-[17px] font-semibold text-charcoal mb-1.5">{title}</h3>
        <p className="text-[13px] leading-relaxed text-muted mb-3.5">{body}</p>
        <div className="flex items-center justify-between gap-2.5">
          <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-faint">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F4C94F] animate-pulse" aria-hidden="true" />
            {waitLabel}
          </span>
          <button
            type="button"
            onClick={onSkip}
            className="text-[13px] font-semibold text-muted hover:text-charcoal px-1 flex-none"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
