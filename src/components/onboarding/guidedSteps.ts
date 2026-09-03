// The continuation that follows the dashboard spotlight tour (OnboardingTour):
// Dashboard -> Hangul -> Vocabulary -> Shop -> farewell, spanning real page
// loads. State lives in localStorage (not a query-param chain) because it has
// to survive full navigations to pages that don't share React state, the same
// reasoning OnboardingTour's own SEEN_KEY already relies on.

export const GUIDED_KEY = "kroot-guided-tour-step";
// Fired whenever the active step changes without a page navigation (e.g.
// hangul-pick -> hangul-stroke, both on /hangul) — a component that mounted
// earlier and already checked localStorage once has no other way to notice
// the step moved on.
export const GUIDED_STEP_EVENT = "kroot:guided-step-changed";

export type GuidedStepKey =
  | "hangul-nav"
  | "hangul-pick"
  | "hangul-stroke"
  | "hangul-nav-vocab"
  | "vocab-chapter"
  | "vocab-days"
  | "vocab-word"
  | "word-box"
  | "word-bank"
  | "shop-nav"
  | "shop-coins"
  | "shop-tabs"
  | "shop-pick"
  | "shop-tryon"
  | "shop-cta"
  | "finish";

// How a step is advanced:
//  - "click": waits for a real click on the spotlit element (the default).
//  - "info":  a "Next" button — the element is only pointed at, though a real
//             click on it advances too so nobody gets stuck.
//  - "ask":   first "Skip / Keep going" (do you want to go on to X?), and
//             once they keep going it turns into a "click" step on the same
//             element ("now tap X"). A click during the ask phase also
//             counts.
export type GuidedMode = "click" | "info" | "ask";
export const GUIDED_MODE: Partial<Record<GuidedStepKey, GuidedMode>> = {
  "hangul-nav": "ask",
  "hangul-nav-vocab": "ask",
  "vocab-chapter": "info",
  "vocab-days": "info",
  "word-box": "info",
  "word-bank": "info",
  "shop-nav": "ask",
  "shop-coins": "info",
  "shop-tabs": "info",
  "shop-tryon": "info",
  "shop-cta": "info",
  finish: "info",
};

// data-tour attribute values the real DOM elements carry. navItems.ts feeds
// this same tourId to both the desktop Sidebar and BottomNav's sheet Tiles,
// so the nav-hop steps' target is identical across breakpoints — only
// *reaching* it differs (see GUIDED_MOBILE_REVEAL below). `null` = no
// element at all: a centred card on a dark scrim (the farewell).
export const GUIDED_TARGET: Record<GuidedStepKey, string | null> = {
  "hangul-nav": "guided-nav-hangul",
  "hangul-pick": "guided-hangul-first-jamo",
  "hangul-stroke": "guided-hangul-stroke",
  "hangul-nav-vocab": "guided-nav-vocabulary",
  "vocab-chapter": "guided-vocab-chapters",
  "vocab-days": "guided-vocab-days",
  "vocab-word": "guided-vocab-first-word",
  "word-box": "guided-word-box",
  "word-bank": "guided-word-bank",
  "shop-nav": "guided-nav-shop",
  "shop-coins": "guided-shop-coins",
  "shop-tabs": "guided-shop-tabs",
  "shop-pick": "guided-shop-first-item",
  "shop-tryon": "guided-shop-tryon",
  "shop-cta": "guided-shop-cta",
  finish: null,
};

// The real Vocabulary nav link just goes to "/vocabulary", which lands on
// whatever chapter is next-up for THAT account — for an account with real
// prior progress (any returning learner, including the test account this
// gets verified against), that's very likely not chapter 1, so
// "guided-vocab-first-word" would spotlight the first word of whatever
// chapter happens to be in progress instead of the actual first word a
// brand-new learner would expect. Force the deep link during this one step
// so the tour always lands on chapter 1 regardless of account history.
export const GUIDED_FORCE_HREF: Partial<Record<GuidedStepKey, string>> = {
  "hangul-nav-vocab": "/vocabulary?chapter=0",
};

// Below md, a nav-hop step's real target lives inside a BottomNav sheet
// that isn't in the DOM until its tab is tapped. GuidedStep spotlights this
// reveal target first (a plain tap, doesn't advance the step) and switches
// to the real target the instant it appears — so the tour still ends on the
// exact element a click-through completes with, it just takes one more real
// tap to get there than the desktop single click does.
export const GUIDED_MOBILE_REVEAL: Partial<Record<GuidedStepKey, string>> = {
  "hangul-nav": "tab-basics",
  "hangul-nav-vocab": "tab-basics",
  "shop-nav": "tab-more",
};

// i18n keys under tour.guided.<step>.{title,body} (+ .ask for "ask" steps)
export const GUIDED_ORDER: GuidedStepKey[] = [
  "hangul-nav",
  "hangul-pick",
  "hangul-stroke",
  "hangul-nav-vocab",
  "vocab-chapter",
  "vocab-days",
  "vocab-word",
  "word-box",
  "word-bank",
  "shop-nav",
  "shop-coins",
  "shop-tabs",
  "shop-pick",
  "shop-tryon",
  "shop-cta",
  "finish",
];

export function guidedNext(step: GuidedStepKey): GuidedStepKey | null {
  const i = GUIDED_ORDER.indexOf(step);
  return GUIDED_ORDER[i + 1] ?? null;
}

export function guidedProgress(step: GuidedStepKey): string {
  return `${GUIDED_ORDER.indexOf(step) + 1} / ${GUIDED_ORDER.length}`;
}

// Arms the first step. The dashboard hosts that step itself (the "shall we
// try Hangul?" ask on the sidebar link), so this also fires the change event
// — the GuidedStep already mounted there has to wake up without a navigation.
export function startGuidedTour() {
  try {
    localStorage.setItem(GUIDED_KEY, GUIDED_ORDER[0]);
  } catch {
    // worst case the learner just stays on the dashboard with no continuation
  }
  window.dispatchEvent(new Event(GUIDED_STEP_EVENT));
}

export function currentGuidedStep(): GuidedStepKey | null {
  try {
    const v = localStorage.getItem(GUIDED_KEY);
    return (GUIDED_ORDER as string[]).includes(v ?? "") ? (v as GuidedStepKey) : null;
  } catch {
    return null;
  }
}
