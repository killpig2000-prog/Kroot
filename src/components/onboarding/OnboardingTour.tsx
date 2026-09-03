"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

const SEEN_KEY = "kroot-onboarding-tour-seen";
const MOBILE_BREAKPOINT = 768; // md — below this the sidebar is replaced by BottomNav

const STEPS = ["sidebar", "basics", "practice", "relax", "tree", "quest", "garden"] as const;
type StepKey = (typeof STEPS)[number];

// STEPS are i18n/copy keys; TARGETS are the data-tour attribute values the
// matching DOM element actually carries. Desktop points at the Sidebar's
// section wrappers ("section-<name>"); below md the sidebar isn't in the
// layout at all, so the same steps point at BottomNav's own tabs instead —
// Relax lives inside its "More" sheet on mobile, so that step points there.
function targetsFor(mobile: boolean): Record<StepKey, string> {
  return mobile
    ? {
        sidebar: "mobile-nav",
        basics: "tab-basics",
        practice: "tab-practice",
        relax: "tab-more",
        tree: "tree",
        quest: "quest",
        garden: "garden",
      }
    : {
        sidebar: "sidebar",
        basics: "section-basics",
        practice: "section-practice",
        relax: "section-relax",
        tree: "tree",
        quest: "quest",
        garden: "garden",
      };
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

type Rect = { top: number; left: number; width: number; height: number };

// First-visit walkthrough: a dark scrim with a cut-out spotlight over one
// data-tour target at a time, plus a tooltip card. Runs once per browser
// (localStorage-gated), at every width — the sidebar/basics/practice/relax
// steps just point at BottomNav's tabs instead of the Sidebar below md.
export default function OnboardingTour() {
  const t = useTranslations("tour");
  const [stepIndex, setStepIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (seen()) return;
    if (typeof window === "undefined") return;
    const id = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const measure = useCallback(() => {
    const key: StepKey = STEPS[stepIndex];
    const target = targetsFor(isMobileViewport())[key];
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [stepIndex]);

  const end = useCallback(() => {
    markSeen();
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const key: StepKey = STEPS[stepIndex];
    const target = targetsFor(isMobileViewport())[key];
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) {
      // Target isn't on the page — e.g. a brand-new first-visit dashboard
      // hasn't unlocked the quest/garden widgets yet. Skip past it instead
      // of dimming the whole screen with no spotlight to show for it.
      if (stepIndex === STEPS.length - 1) end();
      else setStepIndex((i) => i + 1);
      return;
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
  }, [active, stepIndex, measure, end]);

  if (!active) return null;

  const key: StepKey = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const pad = 8;
  const box = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const tipWidth = 300;
  let tipTop = box ? box.top + box.height + 14 : vh / 2;
  let tipLeft = box ? box.left : vw / 2 - tipWidth / 2;
  if (box && tipTop + 190 > vh) tipTop = Math.max(12, box.top - 190);
  if (tipLeft + tipWidth > vw - 12) tipLeft = vw - tipWidth - 12;
  if (tipLeft < 12) tipLeft = 12;

  return (
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={t(`steps.${key}.title`)}>
      <div
        className="absolute inset-0 bg-black/70 transition-[clip-path] duration-300 ease-out"
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
          className="absolute rounded-[12px] pointer-events-none transition-all duration-300 ease-out"
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
        className="absolute w-[300px] rounded-[14px] border border-line bg-cream p-4 shadow-2xl transition-all duration-300 ease-out"
        style={{ top: tipTop, left: tipLeft }}
      >
        <span className="block text-[11px] font-bold uppercase tracking-wide text-success-deep mb-1.5">
          {t("progress", { current: stepIndex + 1, total: STEPS.length })}
        </span>
        <h3 className="text-[17px] font-semibold text-charcoal mb-1.5">{t(`steps.${key}.title`)}</h3>
        <p className="text-[13px] leading-relaxed text-muted mb-3.5">{t(`steps.${key}.body`)}</p>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${i === stepIndex ? "w-4 bg-success" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={end}
              className="text-[13px] font-semibold text-muted hover:text-charcoal px-1"
            >
              {t("skip")}
            </button>
            <button
              type="button"
              onClick={() => (isLast ? end() : setStepIndex((i) => i + 1))}
              className="rounded-[9px] bg-success px-3.5 py-2 text-[13px] font-bold text-white hover:bg-success-deep transition-colors"
            >
              {isLast ? t("done") : t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
