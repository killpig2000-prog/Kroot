"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Bumping this reshows the announcement to everyone, even people who
// dismissed an earlier version — use for a genuinely new announcement.
const ANNOUNCEMENT_KEY = "kroot-feedback-announcement-v1-seen";
export const OPEN_FEEDBACK_EVENT = "kroot:open-feedback";

type View = "closed" | "announce" | "form" | "sent";

export default function FeedbackWidget() {
  const [view, setView] = useState<View>("closed");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (!localStorage.getItem(ANNOUNCEMENT_KEY)) {
        const t = setTimeout(() => setView("announce"), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage unavailable — just skip the announcement.
    }
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

  const dismissAnnouncement = () => {
    try {
      localStorage.setItem(ANNOUNCEMENT_KEY, "1");
    } catch {
      // ignore
    }
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
      try {
        localStorage.setItem(ANNOUNCEMENT_KEY, "1");
      } catch {
        // ignore
      }
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
          className="pointer-events-auto w-full max-w-[380px] bg-[#FAF7EF] border-[1.5px] border-dashed border-[#DDD6C8] rounded-[18px] shadow-[0_24px_60px_-20px_rgba(40,35,25,.4)] px-6 py-6 rotate-[-0.4deg]"
        >
          {view === "announce" && (
            <>
              <span className="text-[26px] block mb-2">🌱</span>
              <b className="block text-[16px] font-extrabold text-[#221F1B] mb-1.5">
                Kroot is brand new!
              </b>
              <p className="text-[13.5px] text-[#6B6560] leading-relaxed mb-5">
                We just launched, so things may be rough around the edges. If something&apos;s
                broken, confusing, or missing — tell us. Every note helps us build the app you
                actually want.
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setView("form")}
                  className="flex-1 rounded-[11px] bg-[#16A34A] text-white font-semibold text-[13.5px] py-2.5 hover:bg-[#15803D] transition-colors"
                >
                  Send feedback
                </button>
                <button
                  onClick={dismissAnnouncement}
                  className="rounded-[11px] border border-[#E3DDD0] bg-white text-[#6B6560] font-semibold text-[13.5px] px-4 py-2.5 hover:border-[#CFC8B8] transition-colors"
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
              <p className="text-[13px] text-[#6B6560] mb-3.5">
                A bug, a rough edge, a feature you wish we had — all welcome.
              </p>
              <textarea
                autoFocus
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                maxLength={2000}
                className="w-full resize-none rounded-[11px] border border-[#E3DDD0] bg-white px-3.5 py-3 text-[13.5px] text-[#221F1B] placeholder:text-[#B7AE9C] focus:outline-none focus:border-[#16A34A]"
              />
              {error && (
                <p className="text-[12px] text-[#DC2626] mt-2">
                  Couldn&apos;t send that — mind trying again?
                </p>
              )}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={submit}
                  disabled={!message.trim() || sending}
                  className="flex-1 rounded-[11px] bg-[#16A34A] text-white font-semibold text-[13.5px] py-2.5 hover:bg-[#15803D] transition-colors disabled:opacity-50 disabled:hover:bg-[#16A34A]"
                >
                  {sending ? "Sending…" : "Send"}
                </button>
                <button
                  onClick={close}
                  className="rounded-[11px] border border-[#E3DDD0] bg-white text-[#6B6560] font-semibold text-[13.5px] px-4 py-2.5 hover:border-[#CFC8B8] transition-colors"
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
              <p className="text-[13.5px] text-[#6B6560] leading-relaxed mb-5">
                Your feedback landed with us. It genuinely shapes what we build next.
              </p>
              <button
                onClick={close}
                className="w-full rounded-[11px] bg-[#16A34A] text-white font-semibold text-[13.5px] py-2.5 hover:bg-[#15803D] transition-colors"
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
