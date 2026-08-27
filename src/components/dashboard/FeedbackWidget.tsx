"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Early-launch notice: shows on every dashboard load (not just once) while
// we're actively soliciting feedback — no dismissal is persisted.
export const OPEN_FEEDBACK_EVENT = "kroot:open-feedback";

type View = "closed" | "announce" | "form" | "sent";

export default function FeedbackWidget() {
  const [view, setView] = useState<View>("closed");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
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
            view === "announce" ? "max-w-[420px] px-8 pt-9 pb-8 text-center" : "max-w-[380px] px-6 py-6"
          }`}
        >
          {view === "announce" && (
            <>
              <svg className="bob w-[92px] h-[92px] mx-auto mb-4" viewBox="0 0 100 100" aria-hidden="true">
                <ellipse cx="50" cy="88" rx="28" ry="5" fill="#F1EEE4" />
                <g className="sway">
                  <path d="M50 78 C50 62 50 56 50 50" stroke="#8B7355" strokeWidth="6" strokeLinecap="round" />
                  <circle cx="50" cy="38" r="24" fill="#22C55E" />
                  <path d="M50 20 C50 8 58 2 70 1 C68 13 61 19 50 20Z" fill="#16A34A" />
                  <circle className="blink" cx="42" cy="38" r="3" fill="#14532D" />
                  <circle className="blink d2" cx="58" cy="38" r="3" fill="#14532D" />
                  <circle cx="37" cy="45" r="3.4" fill="#FB7185" opacity=".45" />
                  <circle cx="63" cy="45" r="3.4" fill="#FB7185" opacity=".45" />
                  <path d="M44 47 Q50 52 56 47" stroke="#14532D" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                </g>
              </svg>
              <b className="block text-[22px] font-extrabold text-[#221F1B] mb-2 tracking-tight">
                We just opened! 🎉
              </b>
              <p className="text-[14.5px] text-muted leading-relaxed mb-7">
                Kroot is brand new, so things may be rough around the edges. Tell us what&apos;s
                broken, confusing, or missing — every note helps us build the app you actually
                want.
              </p>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setView("form")}
                  className="w-full rounded-[13px] bg-success text-white font-bold text-[14.5px] py-3.5 hover:bg-success-deep transition-colors"
                >
                  Send feedback
                </button>
                <button
                  onClick={dismissAnnouncement}
                  className="w-full rounded-[13px] text-faint font-semibold text-[13px] py-1.5 hover:text-muted transition-colors"
                >
                  Maybe later
                </button>
              </div>
            </>
          )}

          {view === "form" && (
            <>
              <b className="block text-[15px] font-extrabold text-[#221F1B] mb-1.5">
                💬 Send feedback
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
              <span className="text-[26px] block mb-2">🙏</span>
              <b className="block text-[16px] font-extrabold text-[#221F1B] mb-1.5">Thank you!</b>
              <p className="text-[13.5px] text-muted leading-relaxed mb-5">
                Your feedback landed with us. It genuinely shapes what we build next.
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
