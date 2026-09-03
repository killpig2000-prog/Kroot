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
  | "vocab-chapter"
  | "vocab-word"
  | "word-goti"
  | "word-bank"
  | "shop-nav"
  | "shop-pick"
  | "shop-cta";

// data-tour attribute values the real DOM elements carry.
export const GUIDED_TARGET: Record<GuidedStepKey, string> = {
  "hangul-pick": "guided-hangul-first-jamo",
  "hangul-nav-vocab": "guided-nav-vocabulary",
  "vocab-chapter": "guided-vocab-chapter-0",
  "vocab-word": "guided-vocab-first-word",
  "word-goti": "guided-word-goti",
  "word-bank": "guided-word-bank",
  "shop-nav": "guided-nav-shop",
  "shop-pick": "guided-shop-first-item",
  "shop-cta": "guided-shop-cta",
};

// i18n keys under tour.guided.<step>.{title,body}
export const GUIDED_ORDER: GuidedStepKey[] = [
  "hangul-pick",
  "hangul-nav-vocab",
  "vocab-chapter",
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
