"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import SpotlightOverlay, { type SpotlightRect } from "@/components/onboarding/SpotlightOverlay";
import {
  GUIDED_KEY,
  GUIDED_MOBILE_REVEAL,
  GUIDED_STEP_EVENT,
  GUIDED_TARGET,
  guidedNext,
  guidedProgress,
  type GuidedStepKey,
} from "@/components/onboarding/guidedSteps";

const MOBILE_BREAKPOINT = 768; // matches OnboardingTour's own breakpoint

// The desktop Sidebar and BottomNav's sheets both render nav links from the
// same navItems.ts data, so a nav-hop step's data-tour id exists TWICE in
// the DOM at once (the desktop one just sits under `hidden md:flex`, real
// display:none below md). Plain querySelector would grab whichever comes
// first in source order regardless of which one a person can actually see
// or click — this picks the one that's actually rendered.
function findVisible(selector: string): HTMLElement | null {
  const matches = document.querySelectorAll<HTMLElement>(selector);
  for (const el of matches) {
    if (el.offsetParent !== null) return el;
  }
  return null;
}

// One step of the post-tour guided walkthrough. Mount one of these per real
// step-target on a page (a page can host more than one, e.g. the word-detail
// page hosts both "word-goti" and "word-bank"); each checks localStorage
// itself and renders nothing unless it's the active step. Advancing isn't a
// "Next" button — it's the real click on the real spotlighted element, so
// clicking through the tour and actually using the feature are the same
// action.
export default function GuidedStep({ step }: { step: GuidedStepKey }) {
  const t = useTranslations("tour");
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const frame = useRef<number | null>(null);

  const checkActive = useCallback(() => {
    let cur: string | null = null;
    try {
      cur = localStorage.getItem(GUIDED_KEY);
    } catch {
      // localStorage unavailable — the guided tour just won't run, no crash
    }
    setActive(cur === step);
  }, [step]);

  useEffect(() => {
    checkActive();
    // A step transition that doesn't navigate (e.g. hangul-pick ->
    // hangul-nav-vocab, both on /hangul) needs every mounted GuidedStep to
    // re-check — a mount-only check would leave the next step's instance
    // never noticing it's now the active one.
    window.addEventListener(GUIDED_STEP_EVENT, checkActive);
    return () => window.removeEventListener(GUIDED_STEP_EVENT, checkActive);
  }, [checkActive]);

  const advance = useCallback(() => {
    const next = guidedNext(step);
    try {
      if (next) localStorage.setItem(GUIDED_KEY, next);
      else localStorage.removeItem(GUIDED_KEY);
    } catch {
      // ignore — worst case the tour just stops here
    }
    setActive(false);
    window.dispatchEvent(new Event(GUIDED_STEP_EVENT));
    if (!next) router.push("/dashboard?tutorial=done");
  }, [step, router]);

  const skip = useCallback(() => {
    try {
      localStorage.removeItem(GUIDED_KEY);
    } catch {
      // ignore
    }
    setActive(false);
    window.dispatchEvent(new Event(GUIDED_STEP_EVENT));
    router.push("/dashboard");
  }, [router]);

  useEffect(() => {
    if (!active) return;
    const target = GUIDED_TARGET[step];
    const revealTarget = GUIDED_MOBILE_REVEAL[step];

    // "reveal" = spotlighting the BottomNav tab that opens the sheet the real
    // target lives in (a plain tap, doesn't advance); "target" = spotlighting
    // the real element itself (click advances). Re-evaluated every frame so
    // the moment the sheet opens and the real target appears, the spotlight
    // hands off to it without the learner needing to do anything else.
    let mode: "target" | "reveal" | null = null;
    let boundEl: HTMLElement | null = null;

    const bind = (el: HTMLElement, isReveal: boolean) => {
      boundEl = el;
      mode = isReveal ? "reveal" : "target";
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      if (!isReveal) el.addEventListener("click", advance);
    };
    const unbind = () => {
      if (boundEl && mode === "target") boundEl.removeEventListener("click", advance);
      boundEl = null;
      mode = null;
    };

    const measure = () => {
      const finalEl = findVisible(`[data-tour="${target}"]`);
      if (finalEl) {
        if (mode !== "target") {
          unbind();
          bind(finalEl, false);
        }
      } else if (revealTarget && window.innerWidth < MOBILE_BREAKPOINT) {
        const revealEl = findVisible(`[data-tour="${revealTarget}"]`);
        if (revealEl && mode !== "reveal") {
          unbind();
          bind(revealEl, true);
        } else if (!revealEl) {
          unbind();
        }
      } else {
        unbind();
      }
      if (boundEl) {
        const r = boundEl.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
    };
    const loop = () => {
      measure();
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    window.addEventListener("resize", measure);
    return () => {
      unbind();
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", measure);
    };
  }, [active, step, advance]);

  if (!active) return null;

  return (
    <SpotlightOverlay
      rect={rect}
      progress={guidedProgress(step)}
      title={t(`guided.${step}.title`)}
      body={t(`guided.${step}.body`)}
      waitLabel={t("guided.waitLabel")}
      skipLabel={t("skip")}
      onSkip={skip}
    />
  );
}
