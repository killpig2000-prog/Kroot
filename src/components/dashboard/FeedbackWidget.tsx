"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { SEEN_KEY as TOUR_SEEN_KEY, TOUR_DONE_EVENT } from "@/components/onboarding/OnboardingTour";
import { GUIDED_STEP_EVENT, currentGuidedStep } from "@/components/onboarding/guidedSteps";

// Early-launch notice: shows on every dashboard load while we're actively
// soliciting feedback. "Close" is per-load only; "Don't show today" hides it
// until the next local calendar day.
export const OPEN_FEEDBACK_EVENT = "kroot:open-feedback";
const HIDE_KEY = "kroot:feedback-notice-hidden-on";

type View = "closed" | "announce" | "form" | "sent";

function localDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function FeedbackWidget() {
  const t = useTranslations("dashboard.feedback");
  const [view, setView] = useState<View>("closed");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    let hiddenToday = false;
    try {
      hiddenToday = localStorage.getItem(HIDE_KEY) === localDateKey();
    } catch {}
    if (hiddenToday) return;

    // The first-visit tour spotlights parts of this same page, and its
    // natural finish hands straight into the click-gated guided tour
    // (Hangul -> Vocabulary -> Shop), which spans several full page loads —
    // so this can't just check once at mount whether the *initial* tour was
    // pending: a guided step can still be active on a later page even
    // though SEEN_KEY was already flipped to "1" back when the initial tour
    // ended. Re-derive "is a tour still going" from both flags on every
    // mount, not just the first.
    const tourActive = () => {
      let initialTourPending = false;
      try {
        initialTourPending = localStorage.getItem(TOUR_SEEN_KEY) !== "1";
      } catch {}
      return initialTourPending || currentGuidedStep() !== null;
    };

    if (tourActive()) {
      const maybeShow = () => {
        if (!tourActive()) setView("announce");
      };
      window.addEventListener(TOUR_DONE_EVENT, maybeShow);
      window.addEventListener(GUIDED_STEP_EVENT, maybeShow);
      return () => {
        window.removeEventListener(TOUR_DONE_EVENT, maybeShow);
        window.removeEventListener(GUIDED_STEP_EVENT, maybeShow);
      };
    }

    const timer = setTimeout(() => setView("announce"), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const openForm = () => setView("form");
    window.addEventListener(OPEN_FEEDBACK_EVENT, openForm);
    return () => window.removeEventListener(OPEN_FEEDBACK_EVENT, openForm);
  }, []);

  useEffect(() => {
    if (view === "closed") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [view]);

  const dismissAnnouncement = () => setView("closed");

  const hideForToday = () => {
    try {
      localStorage.setItem(HIDE_KEY, localDateKey());
    } catch {}
    setView("closed");
  };

  const close = () => {
    setView("closed");
    setError(false);
  };

  const submit = async () => {
    const trimmed = message.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, page: pathname }),
      });
      if (!res.ok) throw new Error("failed");
      setMessage("");
      setView("sent");
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  if (view === "closed") return null;

  return (
    <>
      <button
        aria-label={t("closeAria")}
        onClick={close}
        className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("dialogAria")}
          className={`pointer-events-auto w-full bg-cream rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)] ${
            view === "announce" ? "max-w-[420px] px-7 pt-7 pb-6" : "max-w-[380px] px-6 py-6"
          }`}
        >
          {view === "announce" && (
            <>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                {t("notice")}
              </span>
              <b className="block text-[18px] font-extrabold text-charcoal mb-3 tracking-tight">
                {t("launchedTitle")}
              </b>
              <p className="text-[14px] text-muted leading-relaxed mb-2">
                {t("launchedBody1")}
              </p>
              <p className="text-[14px] text-muted leading-relaxed mb-6">
                {t("launchedBody2")}
              </p>
              <button
                onClick={() => setView("form")}
                className="w-full rounded-[12px] bg-[#221F1B] text-white font-semibold text-[14px] py-3 hover:bg-[#3A3530] transition-colors"
              >
                {t("send")}
              </button>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <button
                  onClick={dismissAnnouncement}
                  className="text-[13px] font-semibold text-muted hover:text-charcoal transition-colors py-1"
                >
                  {t("close")}
                </button>
                <button
                  onClick={hideForToday}
                  className="text-[13px] font-semibold text-faint hover:text-muted transition-colors py-1"
                >
                  {t("hideToday")}
                </button>
              </div>
            </>
          )}

          {view === "form" && (
            <>
              <b className="block text-[15px] font-extrabold text-charcoal mb-1.5">
                {t("send")}
              </b>
              <p className="text-[13px] text-muted mb-3.5">
                {t("formSub")}
              </p>
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("placeholder")}
                rows={5}
                maxLength={2000}
                className="w-full resize-none rounded-[11px] border border-line bg-cream px-3.5 py-3 text-[13.5px] text-charcoal placeholder:text-[#B7AE9C] focus:outline-none focus:border-success"
              />
              {error && (
                <p className="text-[12px] text-danger mt-2">
                  {t("error")}
                </p>
              )}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={submit}
                  disabled={!message.trim() || sending}
                  className="flex-1 rounded-[11px] bg-success text-white font-semibold text-[13.5px] py-2.5 hover:bg-success-deep transition-colors disabled:opacity-50 disabled:hover:bg-success"
                >
                  {sending ? t("sending") : t("submit")}
                </button>
                <button
                  onClick={close}
                  className="rounded-[11px] border border-line bg-cream text-muted font-semibold text-[13.5px] px-4 py-2.5 hover:border-dash transition-colors"
                >
                  {t("cancel")}
                </button>
              </div>
            </>
          )}

          {view === "sent" && (
            <>
              <b className="block text-[16px] font-extrabold text-charcoal mb-1.5">{t("thanksTitle")}</b>
              <p className="text-[13.5px] text-muted leading-relaxed mb-5">
                {t("thanksBody")}
              </p>
              <button
                onClick={close}
                className="w-full rounded-[11px] bg-success text-white font-semibold text-[13.5px] py-2.5 hover:bg-success-deep transition-colors"
              >
                {t("close")}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
