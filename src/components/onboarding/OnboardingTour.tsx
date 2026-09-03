"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import SpotlightOverlay, {
  GHOST_BTN,
  PRIMARY_BTN,
  type SpotlightRect,
} from "@/components/onboarding/SpotlightOverlay";
import { startGuidedTour, type GuidedTrack } from "@/components/onboarding/guidedSteps";

export const SEEN_KEY = "kroot-onboarding-tour-seen";
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

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    // ignore — worst case the tour shows again next visit
  }
}

// First-visit walkthrough: a dark scrim with a cut-out spotlight over one
// data-tour target at a time, plus a tooltip card. Runs once per browser
// (localStorage-gated), at every width — the sidebar/basics/practice/relax
// steps just point at BottomNav's tabs instead of the Sidebar below md.
// Finishing it hands off to the click-gated guided tour (guidedSteps.ts),
// whose first step — "shall we try Hangul?" — lives on this same page.
export default function OnboardingTour({
  startsGuidedTour = false,
  guidedTrack = "basics",
  isAdmin = false,
}: {
  /** Arms the click-gated continuation when the tour finishes naturally. */
  startsGuidedTour?: boolean;
  /** "basics" = Hangul→Vocabulary→Shop (A1); "practice" = Writing→Shop (B1+). */
  guidedTrack?: GuidedTrack;
  /** Admin testing bypass: ignores SEEN_KEY so the tour re-runs on every dashboard load. */
  isAdmin?: boolean;
} = {}) {
  const t = useTranslations("tour");
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!isAdmin && seen()) return;
    if (typeof window === "undefined") return;
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, [isAdmin]);

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
      markSeen();
      setActive(false);
      // Arm the guided tour BEFORE announcing the tour is done: FeedbackWidget
      // reacts to TOUR_DONE_EVENT by checking whether a guided step is active,
      // and would pop its own notice over the first step otherwise.
      if (continueOn && startsGuidedTour) startGuidedTour(guidedTrack);
      window.dispatchEvent(new Event(TOUR_DONE_EVENT));
    },
    [startsGuidedTour, guidedTrack]
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
          <button type="button" onClick={() => end(false)} className={GHOST_BTN}>
            {t("skip")}
          </button>
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
