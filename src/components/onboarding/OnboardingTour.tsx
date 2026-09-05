"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import SpotlightOverlay, {
  GHOST_BTN,
  PRIMARY_BTN,
  type SpotlightRect,
} from "@/components/onboarding/SpotlightOverlay";
import { startGuidedTour, type GuidedTrack } from "@/components/onboarding/guidedSteps";

const SEEN_PREFIX = "kroot-onboarding-tour-seen";
// Per-account, not just per-browser: a phone that already ran the tour under
// one login used to never show it again for a second account signing up on
// the same device. Falls back to the shared key pre-account-id (a signed-out
// visitor, or the one caller that doesn't pass a userId) so behaviour is
// unchanged there.
function seenKey(userId?: string | null): string {
  return userId ? `${SEEN_PREFIX}:${userId}` : SEEN_PREFIX;
}
export const TOUR_DONE_EVENT = "kroot:tour-done";
const MOBILE_BREAKPOINT = 768; // md — below this the sidebar is replaced by BottomNav

// "welcome" has no target: a centred card on a solid scrim, the first thing a
// brand-new learner sees. Everything after it spotlights one real element.
const STEPS = ["welcome", "sidebar", "basics", "practice", "relax", "tree", "quest", "garden"] as const;
type StepKey = (typeof STEPS)[number];

// STEPS are i18n/copy keys; TARGETS are the data-tour attribute values the
// matching DOM element actually carries. Desktop points at the Sidebar's
// section wrappers ("section-<name>"); below md the sidebar isn't in the
// layout at all, so the same steps point at BottomNav's own tabs instead —
// Relax lives inside its "More" sheet on mobile, so that step points there.
function targetsFor(mobile: boolean): Record<StepKey, string | null> {
  return mobile
    ? {
        welcome: null,
        sidebar: "mobile-nav",
        basics: "tab-basics",
        practice: "tab-practice",
        relax: "tab-more",
        tree: "tree",
        quest: "quest",
        garden: "garden",
      }
    : {
        welcome: null,
        sidebar: "sidebar",
        basics: "section-basics",
        practice: "section-practice",
        relax: "section-relax",
        tree: "tree",
        quest: "quest",
        garden: "garden",
      };
}

// Ring padding per target. BottomNav is flush with the screen edges and its
// tabs are only 56px tall — the default 8px ring spills off the bottom of
// the viewport on the bar and swallows the neighbouring tabs on a single
// tab, so those get a tight ring that matches the element.
function padFor(target: string | null): number {
  if (target === "mobile-nav") return 0;
  if (target?.startsWith("tab-")) return 3;
  return 8;
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
}

function seen(userId?: string | null): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return false;
  }
}
function markSeen(userId?: string | null) {
  try {
    localStorage.setItem(seenKey(userId), "1");
    localStorage.removeItem(progressKey(userId));
  } catch {
    // ignore — worst case the tour shows again next visit
  }
}

const PROGRESS_PREFIX = "kroot-onboarding-tour-step";
function progressKey(userId?: string | null): string {
  return userId ? `${PROGRESS_PREFIX}:${userId}` : PROGRESS_PREFIX;
}
/** Same policy as the click-gated guided tour that follows this one (whose
 * own step already survives a real page navigation): Skip or finishing both
 * retire the tour for good (see `markSeen`), but getting cut off mid-way — a
 * reload, a crashed tab, the app closed — resumes at the step it was on
 * instead of dropping the learner back at "welcome". */
function loadProgress(userId?: string | null): number {
  try {
    const raw = localStorage.getItem(progressKey(userId));
    const i = raw ? Number(raw) : 0;
    return Number.isInteger(i) && i >= 0 && i < STEPS.length ? i : 0;
  } catch {
    return 0;
  }
}
function saveProgress(userId: string | null | undefined, index: number) {
  try {
    localStorage.setItem(progressKey(userId), String(index));
  } catch {
    // ignore — worst case an interruption restarts from the top
  }
}

// First-visit walkthrough: a dark scrim with a cut-out spotlight over one
// data-tour target at a time, plus a tooltip card. Runs once per account
// (localStorage-gated, keyed by userId — see `seenKey`), at every width — the
// sidebar/basics/practice/relax steps just point at BottomNav's tabs instead
// of the Sidebar below md. Finishing it hands off to the click-gated guided
// tour (guidedSteps.ts), whose first step — "shall we try Hangul?" — lives on
// this same page.
//
// When to show it again — the three ways a run can end:
//   - Skip (only offered on "welcome")   -> retired for good, never again.
//   - Finish (reach the last step, or run out of targets and auto-skip to
//     the end)                           -> retired for good, hands off to
//                                            the guided tour.
//   - Cut off mid-way (reload, a crashed tab, the app closed) -> resumes at
//     the step it was on next time, same policy the guided tour already
//     uses for its own (longer, multi-page) run.
// Admin's bypass bucks this: every load restarts at step 0 regardless of
// how a previous test run ended, since QA wants the whole thing every time.
export default function OnboardingTour({
  startsGuidedTour = false,
  guidedTrack = "basics",
  isAdmin = false,
  userId = null,
}: {
  /** Arms the click-gated continuation when the tour finishes naturally. */
  startsGuidedTour?: boolean;
  /** "basics" = Hangul→Vocabulary→Shop (A1); "practice" = Writing→Shop (B1+). */
  guidedTrack?: GuidedTrack;
  /** Admin testing bypass: ignores the seen-flag so the tour re-runs on every dashboard load. */
  isAdmin?: boolean;
  /** Scopes the seen-flag to this account, so a second signup on a phone
   * that already ran the tour under a different login still gets it. */
  userId?: string | null;
} = {}) {
  const t = useTranslations("tour");
  // Lazy initializer, not 0 + an effect: reading localStorage here (client-
  // only render, same as `active` below) means the very first real render
  // already resumes on the right step instead of flashing "welcome" first.
  // Admin's every-load bypass is for QA — it always restarts at the top
  // rather than resuming, or a partial run from an earlier test would hide
  // the very steps it was meant to re-check.
  const [stepIndex, setStepIndex] = useState(() =>
    typeof window === "undefined" || isAdmin ? 0 : loadProgress(userId)
  );
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!isAdmin && seen(userId)) return;
    if (typeof window === "undefined") return;
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, [isAdmin, userId]);

  // Every step advance is a checkpoint: a reload, a crashed tab, or the app
  // getting closed mid-tour resumes here instead of restarting at "welcome".
  // Admin's runs aren't checkpointed — see the initializer above.
  useEffect(() => {
    if (active && !isAdmin) saveProgress(userId, stepIndex);
  }, [active, isAdmin, stepIndex, userId]);

  const key: StepKey = STEPS[stepIndex];
  const target = targetsFor(isMobileViewport())[key];

  const measure = useCallback(() => {
    if (!target) {
      setRect(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [target]);

  // navigate=false is for a learner explicitly bailing out via "Skip" — only
  // a natural finish (reaching the last step, or running out of targets)
  // carries them on into the guided tour.
  const end = useCallback(
    (continueOn = true) => {
      markSeen(userId);
      setActive(false);
      // Arm the guided tour BEFORE announcing the tour is done, so anything
      // listening for TOUR_DONE_EVENT already sees a guided step active.
      if (continueOn && startsGuidedTour) startGuidedTour(guidedTrack);
      window.dispatchEvent(new Event(TOUR_DONE_EVENT));
    },
    [startsGuidedTour, guidedTrack, userId]
  );

  useEffect(() => {
    if (!active || !target) return; // no target = centred card, nothing to track
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    // offsetParent null = display:none (e.g. the quest card is `hidden
    // sm:block` on a phone when reviews are due) — a zero-size ring in the
    // corner is worse than no step at all.
    if (!el || el.offsetParent === null) {
      // Target isn't on the page — e.g. a brand-new first-visit dashboard
      // hasn't unlocked the quest/garden widgets yet. Skip past it instead
      // of dimming the whole screen with no spotlight to show for it.
      const id = requestAnimationFrame(() => {
        if (stepIndex === STEPS.length - 1) end();
        else setStepIndex((i) => i + 1);
      });
      return () => cancelAnimationFrame(id);
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });

    const loop = () => {
      measure();
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    window.addEventListener("resize", measure);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", measure);
    };
  }, [active, stepIndex, target, measure, end]);

  if (!active) return null;

  const isLast = stepIndex === STEPS.length - 1;

  return (
    <SpotlightOverlay
      rect={target ? rect : null}
      pad={padFor(target)}
      progress={t("progress", { current: stepIndex + 1, total: STEPS.length })}
      title={t(`steps.${key}.title`)}
      body={t(`steps.${key}.body`)}
      footerLeft={
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-4 bg-success" : "w-1.5 bg-line"}`}
            />
          ))}
        </div>
      }
      actions={
        <>
          {/* Skip only before committing, on "welcome" — once "Let's go" is
              tapped the walkthrough runs to its own natural end, same rule
              as the guided tour's "ask" steps. */}
          {key === "welcome" && (
            <button type="button" onClick={() => end(false)} className={GHOST_BTN}>
              {t("skip")}
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? end() : setStepIndex((i) => i + 1))}
            className={PRIMARY_BTN}
          >
            {key === "welcome" ? t("letsGo") : isLast ? t("done") : t("next")}
          </button>
        </>
      }
    />
  );
}
