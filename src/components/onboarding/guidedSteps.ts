// The click-gated continuation that follows the dashboard spotlight tour
// (OnboardingTour): Hangul -> Vocabulary -> Shop, spanning real page loads.
// State lives in localStorage (not a query-param chain) because it has to
// survive full navigations to pages that don't share React state, the same
// reasoning OnboardingTour's own SEEN_KEY already relies on.

export const GUIDED_KEY = "kroot-guided-tour-step";
// Fired whenever the active step changes without a page navigation (e.g.
// hangul-pick -> hangul-nav-vocab, both on /hangul) — a component that
// mounted earlier and already checked localStorage once has no other way to
// notice the step moved on.
export const GUIDED_STEP_EVENT = "kroot:guided-step-changed";

export type GuidedStepKey =
  | "hangul-pick"
  | "hangul-nav-vocab"
  | "vocab-word"
  | "word-goti"
  | "word-bank"
  | "shop-nav"
  | "shop-pick"
  | "shop-cta";

// data-tour attribute values the real DOM elements carry. navItems.ts feeds
// this same tourId to both the desktop Sidebar and BottomNav's sheet Tiles,
// so the nav-hop steps' target is identical across breakpoints — only
// *reaching* it differs (see GUIDED_MOBILE_REVEAL below).
export const GUIDED_TARGET: Record<GuidedStepKey, string> = {
  "hangul-pick": "guided-hangul-first-jamo",
  "hangul-nav-vocab": "guided-nav-vocabulary",
  "vocab-word": "guided-vocab-first-word",
  "word-goti": "guided-word-goti",
  "word-bank": "guided-word-bank",
  "shop-nav": "guided-nav-shop",
  "shop-pick": "guided-shop-first-item",
  "shop-cta": "guided-shop-cta",
};

// Below md, a nav-hop step's real target lives inside a BottomNav sheet
// that isn't in the DOM until its tab is tapped. GuidedStep spotlights this
// reveal target first (a plain tap, doesn't advance the step) and switches
// to the real target the instant it appears — so the tour still ends on the
// exact element a click-through completes with, it just takes one more real
// tap to get there than the desktop single click does.
export const GUIDED_MOBILE_REVEAL: Partial<Record<GuidedStepKey, string>> = {
  "hangul-nav-vocab": "tab-basics",
  "shop-nav": "tab-more",
};

// i18n keys under tour.guided.<step>.{title,body}
export const GUIDED_ORDER: GuidedStepKey[] = [
  "hangul-pick",
  "hangul-nav-vocab",
  "vocab-word",
  "word-goti",
  "word-bank",
  "shop-nav",
  "shop-pick",
  "shop-cta",
];

export function guidedNext(step: GuidedStepKey): GuidedStepKey | null {
  const i = GUIDED_ORDER.indexOf(step);
  return GUIDED_ORDER[i + 1] ?? null;
}

export function guidedProgress(step: GuidedStepKey): string {
  return `${GUIDED_ORDER.indexOf(step) + 1} / ${GUIDED_ORDER.length}`;
}

export function startGuidedTour() {
  try {
    localStorage.setItem(GUIDED_KEY, GUIDED_ORDER[0]);
  } catch {
    // worst case the learner just lands on Hangul with no continuation
  }
}

export function currentGuidedStep(): GuidedStepKey | null {
  try {
    const v = localStorage.getItem(GUIDED_KEY);
    return (GUIDED_ORDER as string[]).includes(v ?? "") ? (v as GuidedStepKey) : null;
  } catch {
    return null;
  }
}
