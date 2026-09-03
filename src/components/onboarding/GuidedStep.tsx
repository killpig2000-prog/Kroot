"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import SpotlightOverlay, { type SpotlightRect } from "@/components/onboarding/SpotlightOverlay";
import {
  GUIDED_KEY,
  GUIDED_STEP_EVENT,
  GUIDED_TARGET,
  guidedNext,
  guidedProgress,
  type GuidedStepKey,
} from "@/components/onboarding/guidedSteps";

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
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) return; // target should always be a real, permanent element for these steps
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    el.addEventListener("click", advance);

    const measure = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    const loop = () => {
      measure();
      frame.current = requestAnimationFrame(loop);
    };
    frame.current = requestAnimationFrame(loop);
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("click", advance);
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
