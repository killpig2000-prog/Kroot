// The continuation that follows the dashboard spotlight tour (OnboardingTour).
// Two tracks, picked by the learner's placement level: A1 gets
// Dashboard -> Hangul -> Vocabulary -> Shop -> farewell; anyone who placed
// B1 or above already knows the alphabet, so they get
// Dashboard -> Writing -> Reading -> Shop -> farewell instead. Both span real
// page loads. State lives in localStorage (not a query-param chain) because it has
// to survive full navigations to pages that don't share React state, the same
// reasoning OnboardingTour's own SEEN_KEY already relies on.

export const GUIDED_KEY = "kroot-guided-tour-step";
// Fired whenever the active step changes without a page navigation (e.g.
// hangul-pick -> hangul-stroke, both on /hangul) — a component that mounted
// earlier and already checked localStorage once has no other way to notice
// the step moved on.
export const GUIDED_STEP_EVENT = "kroot:guided-step-changed";
// Which track is running — decides what "next step" means for the shared
// Shop/farewell tail and what the "n / total" counter reads.
export const GUIDED_TRACK_KEY = "kroot-guided-tour-track";
export type GuidedTrack = "basics" | "practice";

export type GuidedStepKey =
  | "hangul-nav"
  | "hangul-pick"
  | "hangul-stroke"
  | "hangul-nav-vocab"
  | "vocab-chapter"
  | "vocab-days"
  | "vocab-word"
  | "word-box"
  | "word-goti"
  | "word-bank"
  | "writing-nav"
  | "writing-level"
  | "writing-groups"
  | "writing-chapter"
  | "writing-board"
  | "writing-check"
  | "writing-result"
  | "reading-nav"
  | "reading-chapter"
  | "reading-tools"
  | "reading-text"
  | "reading-word"
  | "reading-quiz"
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
//  - "watch": no button and no click gate — the step advances by itself the
//             moment GUIDED_ADVANCE_WHEN's selector matches (e.g. the
//             sentence board is full). Used where the learner has to do
//             several taps inside the ring before there's anything to "tap
//             next", and a card sitting over that area would block them.
export type GuidedMode = "click" | "info" | "ask" | "watch";
export const GUIDED_MODE: Partial<Record<GuidedStepKey, GuidedMode>> = {
  "hangul-nav": "ask",
  "hangul-nav-vocab": "ask",
  "vocab-chapter": "info",
  "vocab-days": "info",
  "word-box": "info",
  "word-bank": "info",
  "writing-nav": "ask",
  "writing-level": "info",
  "writing-groups": "info",
  "writing-board": "watch",
  "writing-result": "info",
  "reading-nav": "ask",
  "reading-tools": "info",
  "reading-text": "info",
  // Info, not click: a passage with no glossed word at all would otherwise
  // strand a click-gated step with nothing to tap.
  "reading-word": "info",
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
  "word-goti": "guided-word-goti",
  "word-bank": "guided-word-bank",
  "writing-nav": "guided-nav-writing",
  "writing-level": "guided-writing-level",
  "writing-groups": "guided-writing-groups",
  "writing-chapter": "guided-writing-chapter",
  "writing-board": "guided-writing-board",
  "writing-check": "guided-writing-check",
  "writing-result": "guided-writing-result",
  "reading-nav": "guided-nav-reading",
  "reading-chapter": "guided-reading-chapter",
  "reading-tools": "guided-reading-tools",
  "reading-text": "guided-reading-text",
  "reading-word": "guided-reading-word",
  "reading-quiz": "guided-reading-quiz",
  "shop-nav": "guided-nav-shop",
  "shop-coins": "guided-shop-coins",
  "shop-tabs": "guided-shop-tabs",
  "shop-pick": "guided-shop-first-item",
  "shop-tryon": "guided-shop-tryon",
  "shop-cta": "guided-shop-cta",
  finish: null,
};

// Click steps that hold the spotlight for a moment AFTER the click before
// moving on — "hangul-stroke": tapping the stroke box replays the strokes
// and speaks the letter, and the learner should get to watch that finish
// (ㄱ's stroke + the audio is well under 2s) instead of the next card
// snapping in over it.
// "reading-word": tapping a glossed word opens its card in place — give the
// learner a moment to actually read it before the spotlight moves on.
// "watch" steps: advance once this selector matches anything in the DOM.
// writing-board is done when the Check button under it stops being disabled,
// i.e. every slot is filled — then the next step rings Check itself.
export const GUIDED_ADVANCE_WHEN: Partial<Record<GuidedStepKey, string>> = {
  "writing-board": '[data-tour="guided-writing-check"]:not([disabled])',
};

export const GUIDED_ADVANCE_DELAY_MS: Partial<Record<GuidedStepKey, number>> = {
  "hangul-stroke": 2000,
  "reading-word": 2500,
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
  "writing-nav": "tab-practice",
  "reading-nav": "tab-practice",
  "shop-nav": "tab-more",
};

// i18n keys under tour.guided.<step>.{title,body} (+ .ask for "ask" steps)
const SHOP_TAIL: GuidedStepKey[] = [
  "shop-nav",
  "shop-coins",
  "shop-tabs",
  "shop-pick",
  "shop-tryon",
  "shop-cta",
  "finish",
];
export const GUIDED_ORDERS: Record<GuidedTrack, GuidedStepKey[]> = {
  basics: [
    "hangul-nav",
    "hangul-pick",
    "hangul-stroke",
    "hangul-nav-vocab",
    "vocab-chapter",
    "vocab-days",
    "vocab-word",
    "word-box",
    "word-goti",
    "word-bank",
    ...SHOP_TAIL,
  ],
  practice: [
    "writing-nav",
    "writing-level",
    "writing-groups",
    "writing-chapter",
    "writing-board",
    "writing-check",
    "writing-result",
    "reading-nav",
    "reading-chapter",
    "reading-tools",
    "reading-text",
    "reading-word",
    "reading-quiz",
    ...SHOP_TAIL,
  ],
};
const ALL_STEPS = new Set<string>([...GUIDED_ORDERS.basics, ...GUIDED_ORDERS.practice]);

// The stored track wins; a step that only exists on one track identifies it
// on its own, and the shared Shop tail falls back to basics (the counter is
// the only thing that would differ).
function orderFor(step: GuidedStepKey): GuidedStepKey[] {
  let track: string | null = null;
  try {
    track = localStorage.getItem(GUIDED_TRACK_KEY);
  } catch {
    // fall through to the step-based guess
  }
  if (track === "basics" || track === "practice") return GUIDED_ORDERS[track];
  return GUIDED_ORDERS.practice.includes(step) && !GUIDED_ORDERS.basics.includes(step)
    ? GUIDED_ORDERS.practice
    : GUIDED_ORDERS.basics;
}

export function guidedNext(step: GuidedStepKey): GuidedStepKey | null {
  const order = orderFor(step);
  const i = order.indexOf(step);
  return order[i + 1] ?? null;
}

export function guidedProgress(step: GuidedStepKey): string {
  const order = orderFor(step);
  return `${order.indexOf(step) + 1} / ${order.length}`;
}

// Arms the first step of a track. The dashboard hosts that step itself (the
// "shall we try Hangul / Writing?" ask on the sidebar link), so this also
// fires the change event — the GuidedStep already mounted there has to wake
// up without a navigation.
export function startGuidedTour(track: GuidedTrack = "basics") {
  try {
    localStorage.setItem(GUIDED_TRACK_KEY, track);
    localStorage.setItem(GUIDED_KEY, GUIDED_ORDERS[track][0]);
  } catch {
    // worst case the learner just stays on the dashboard with no continuation
  }
  window.dispatchEvent(new Event(GUIDED_STEP_EVENT));
}

export function currentGuidedStep(): GuidedStepKey | null {
  try {
    const v = localStorage.getItem(GUIDED_KEY);
    return ALL_STEPS.has(v ?? "") ? (v as GuidedStepKey) : null;
  } catch {
    return null;
  }
}
