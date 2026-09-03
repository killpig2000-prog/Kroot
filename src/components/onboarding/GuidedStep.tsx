"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import SpotlightOverlay, {
  GHOST_BTN,
  PRIMARY_BTN,
  WaitHint,
  type SpotlightRect,
} from "@/components/onboarding/SpotlightOverlay";
import {
  GUIDED_FORCE_HREF,
  GUIDED_KEY,
  GUIDED_MOBILE_REVEAL,
  GUIDED_MODE,
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
// page hosts "word-box", "word-bank" and "shop-nav"); each checks
// localStorage itself and renders nothing unless it's the active step.
//
// Three shapes (see GUIDED_MODE): a click-gated step advances on the real
// click on the real spotlit element, so clicking through the tour and
// actually using the feature are the same action; an info step just points
// and offers Next; an ask step asks first ("shall we go on to X?") and only
// then waits for the click.
export default function GuidedStep({ step }: { step: GuidedStepKey }) {
  const t = useTranslations("tour");
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<SpotlightRect | null>(null);
  const [isReveal, setIsReveal] = useState(false);
  const [asking, setAsking] = useState(false);
  const frame = useRef<number | null>(null);
  const advancedRef = useRef(false);

  const mode = GUIDED_MODE[step] ?? "click";
  const target = GUIDED_TARGET[step];
  const isLast = guidedNext(step) === null;

  const checkActive = useCallback(() => {
    let cur: string | null = null;
    try {
      cur = localStorage.getItem(GUIDED_KEY);
    } catch {
      // localStorage unavailable — the guided tour just won't run, no crash
    }
    const on = cur === step;
    setActive(on);
    if (on) setAsking(mode === "ask");
  }, [step, mode]);

  useEffect(() => {
    // Initial check is deferred a frame: localStorage isn't there during
    // SSR, so this can't be a lazy initializer without a hydration mismatch.
    const id = requestAnimationFrame(checkActive);
    // A step transition that doesn't navigate (e.g. hangul-pick ->
    // hangul-stroke, both on /hangul) needs every mounted GuidedStep to
    // re-check — a mount-only check would leave the next step's instance
    // never noticing it's now the active one.
    window.addEventListener(GUIDED_STEP_EVENT, checkActive);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(GUIDED_STEP_EVENT, checkActive);
    };
  }, [checkActive]);

  const advance = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
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
    if (pathname !== "/dashboard") router.push("/dashboard");
  }, [router, pathname]);

  useEffect(() => {
    if (!active) return;
    advancedRef.current = false;
    // No target = centred card, nothing to measure or bind (the render
    // below ignores `rect` in that case).
    if (!target) return;
    const revealTarget = GUIDED_MOBILE_REVEAL[step];
    const forceHref = GUIDED_FORCE_HREF[step];

    // A step whose real target's natural href would land somewhere other
    // than what the tour needs (e.g. "/vocabulary" resolving to whatever
    // chapter is next-up for THIS account, not chapter 1) overrides the
    // click's default navigation and sends the learner to forceHref instead.
    const onClick = (e: MouseEvent) => {
      if (forceHref) {
        e.preventDefault();
        advance();
        router.push(forceHref);
      } else {
        advance();
      }
    };

    // "reveal" = spotlighting the BottomNav tab that opens the sheet the real
    // target lives in (a plain tap, doesn't advance); "target" = spotlighting
    // the real element itself (click advances). Re-evaluated every frame so
    // the moment the sheet opens and the real target appears, the spotlight
    // hands off to it without the learner needing to do anything else.
    let bound: "target" | "reveal" | null = null;
    let boundEl: HTMLElement | null = null;

    const bind = (el: HTMLElement, reveal: boolean) => {
      boundEl = el;
      bound = reveal ? "reveal" : "target";
      setIsReveal(reveal);
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      if (!reveal) el.addEventListener("click", onClick);
    };
    const unbind = () => {
      if (boundEl && bound === "target") boundEl.removeEventListener("click", onClick);
      boundEl = null;
      bound = null;
    };

    const measure = () => {
      const finalEl = findVisible(`[data-tour="${target}"]`);
      if (finalEl) {
        if (bound !== "target" || boundEl !== finalEl) {
          unbind();
          bind(finalEl, false);
        }
      } else if (revealTarget && window.innerWidth < MOBILE_BREAKPOINT) {
        const revealEl = findVisible(`[data-tour="${revealTarget}"]`);
        if (revealEl && bound !== "reveal") {
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
  }, [active, step, target, advance, router]);

  if (!active) return null;

  const skipBtn = (
    <button type="button" onClick={skip} className={GHOST_BTN}>
      {t("skip")}
    </button>
  );

  let title = t(`guided.${step}.title`);
  let body = t(`guided.${step}.body`);
  let footerLeft: ReactNode = null;
  let actions: ReactNode;

  if (mode === "ask" && asking) {
    // "Shall we go on to X?" — Keep going turns this into the click step.
    title = t(`guided.${step}.askTitle`);
    body = t(`guided.${step}.askBody`);
    actions = (
      <>
        {skipBtn}
        <button type="button" onClick={() => setAsking(false)} className={PRIMARY_BTN}>
          {t("keepGoing")}
        </button>
      </>
    );
  } else if (mode === "info") {
    actions = (
      <>
        {!isLast && skipBtn}
        <button type="button" onClick={advance} className={PRIMARY_BTN}>
          {isLast ? t("finish") : t("next")}
        </button>
      </>
    );
  } else {
    footerLeft = <WaitHint label={t("guided.waitLabel")} />;
    actions = skipBtn;
  }

  return (
    <SpotlightOverlay
      rect={target ? rect : null}
      pad={isReveal ? 4 : 8}
      progress={guidedProgress(step)}
      title={title}
      body={body}
      footerLeft={footerLeft}
      actions={actions}
    />
  );
}
