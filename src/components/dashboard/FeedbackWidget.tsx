"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/navigation";

// Feedback lives behind one button. It used to open itself as a launch notice
// on every load; that interrupted the page, so now nothing appears until the
// learner taps it.
//
// Where that button sits depends on the screen. On desktop it floats in the
// bottom-right corner, which is out of the way. On a phone a floating button
// covered the page no matter where the learner scrolled, so there it moves
// into the corner of the study-garden card instead — see FeedbackButton,
// which the dashboard passes to MonthlyGrass. Both open this same dialog
// through one event, so the trigger can live anywhere in the tree.
const OPEN_EVENT = "kroot:feedback-open";

/** The phone-side trigger: sits in the study garden's bottom-right corner. */
export function FeedbackButton() {
  const t = useTranslations("dashboard.feedback");
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="md:hidden inline-flex items-center gap-1.5 rounded-full border border-line bg-warm px-2.5 py-1 text-[11px] font-semibold text-muted hover:text-charcoal hover:border-dash transition-colors"
    >
      <span aria-hidden="true">💬</span>
      {t("send")}
    </button>
  );
}

type View = "closed" | "form" | "sent";

export default function FeedbackWidget() {
  const t = useTranslations("dashboard.feedback");
  const [view, setView] = useState<View>("closed");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const open = () => setView("form");
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  useEffect(() => {
    if (view === "closed") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [view]);

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

  if (view === "closed") {
    return (
      // Desktop only. On a phone this floated over whatever the learner was
      // reading; the study garden's corner holds the trigger there instead
      // (FeedbackButton above).
      <button
        type="button"
        onClick={() => setView("form")}
        className="hidden md:inline-flex fixed z-[50] md:right-6 md:bottom-6 items-center gap-2 rounded-full bg-[#221F1B] text-white font-semibold text-[14px] pl-4 pr-[18px] py-3 shadow-[0_10px_30px_-10px_rgba(40,35,25,.5)] hover:bg-[#3A3530] transition-colors"
      >
        <span aria-hidden="true" className="text-[17px] leading-none">💬</span>
        {t("send")}
      </button>
    );
  }

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
          className="pointer-events-auto w-full max-w-[380px] bg-cream rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)] px-6 py-6"
        >
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
