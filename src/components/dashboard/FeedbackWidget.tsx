"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

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
    const t = setTimeout(() => setView("announce"), 600);
    return () => clearTimeout(t);
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
        aria-label="Close"
        onClick={close}
        className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Feedback"
          className={`pointer-events-auto w-full bg-white rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)] ${
            view === "announce" ? "max-w-[420px] px-7 pt-7 pb-6" : "max-w-[380px] px-6 py-6"
          }`}
        >
          {view === "announce" && (
            <>
              <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                Notice
              </span>
              <b className="block text-[18px] font-extrabold text-[#221F1B] mb-3 tracking-tight">
                Kroot has recently launched
              </b>
              <p className="text-[14px] text-muted leading-relaxed mb-2">
                The app is still early and has many shortcomings. We are continuing to improve
                it.
              </p>
              <p className="text-[14px] text-muted leading-relaxed mb-6">
                If you have any opinions or suggestions, we would appreciate hearing them.
              </p>
              <button
                onClick={() => setView("form")}
                className="w-full rounded-[12px] bg-[#221F1B] text-white font-semibold text-[14px] py-3 hover:bg-[#3A3530] transition-colors"
              >
                Send feedback
              </button>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
                <button
                  onClick={dismissAnnouncement}
                  className="text-[13px] font-semibold text-muted hover:text-[#221F1B] transition-colors py-1"
                >
                  Close
                </button>
                <button
                  onClick={hideForToday}
                  className="text-[13px] font-semibold text-faint hover:text-muted transition-colors py-1"
                >
                  Don&apos;t show again today
                </button>
              </div>
            </>
          )}

          {view === "form" && (
            <>
              <b className="block text-[15px] font-extrabold text-[#221F1B] mb-1.5">
                Send feedback
              </b>
              <p className="text-[13px] text-muted mb-3.5">
                A bug, a rough edge, a feature you wish we had — all welcome.
              </p>
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                maxLength={2000}
                className="w-full resize-none rounded-[11px] border border-line bg-white px-3.5 py-3 text-[13.5px] text-[#221F1B] placeholder:text-[#B7AE9C] focus:outline-none focus:border-success"
              />
              {error && (
                <p className="text-[12px] text-danger mt-2">
                  Couldn&apos;t send that — mind trying again?
                </p>
              )}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={submit}
                  disabled={!message.trim() || sending}
                  className="flex-1 rounded-[11px] bg-success text-white font-semibold text-[13.5px] py-2.5 hover:bg-success-deep transition-colors disabled:opacity-50 disabled:hover:bg-success"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
                <button
                  onClick={close}
                  className="rounded-[11px] border border-line bg-white text-muted font-semibold text-[13.5px] px-4 py-2.5 hover:border-[#CFC8B8] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {view === "sent" && (
            <>
              <b className="block text-[16px] font-extrabold text-[#221F1B] mb-1.5">Thank you</b>
              <p className="text-[13.5px] text-muted leading-relaxed mb-5">
                Your feedback has been received. We read every message and use it to decide
                what to improve next.
              </p>
              <button
                onClick={close}
                className="w-full rounded-[11px] bg-success text-white font-semibold text-[13.5px] py-2.5 hover:bg-success-deep transition-colors"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
