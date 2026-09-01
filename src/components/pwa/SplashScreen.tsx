"use client";

import { useEffect, useState } from "react";
import { isStandalone } from "@/lib/push-client";

const SHOWN_KEY = "kroot-splash-shown";
const HOLD_MS = 1300;
const FADE_MS = 400;

/**
 * A one-time bounce-in splash shown only inside the installed PWA/TWA, right
 * after the OS's own manifest-driven splash hands off. A normal browser tab
 * never renders this — isStandalone() gates it, and sessionStorage keeps it
 * from replaying on every client-side navigation within the same session.
 */
export default function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">("hidden");

  useEffect(() => {
    if (!isStandalone()) return;
    if (sessionStorage.getItem(SHOWN_KEY)) return;
    sessionStorage.setItem(SHOWN_KEY, "1");
    // Syncing from an external, mount-time-only signal (display-mode + a
    // one-shot sessionStorage flag) — there's no way to know this before an
    // effect runs, so this isn't the render-derivable state the rule expects.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("visible");
    const leave = setTimeout(() => setPhase("leaving"), HOLD_MS);
    const remove = setTimeout(() => setPhase("hidden"), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(leave);
      clearTimeout(remove);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div className={`splash${phase === "leaving" ? " splash-leave" : ""}`} aria-hidden="true">
      <div className="splash-mark">
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <rect width="64" height="64" rx="15" fill="#FFF9EC" />
          <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.25" fill="none" stroke="#E8E0CF" strokeWidth="1.5" />
          <rect x="8" y="42" width="48" height="3.5" rx="1.75" fill="#6BBF8A" />
          <path d="M20 13 V42" stroke="#3E7C59" strokeWidth="8.5" strokeLinecap="round" />
          <path d="M45 13 L24 31 L46 42" fill="none" stroke="#3E7C59" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 45 V52 M20 47 L12 55 M20 47 L28 55" fill="none" stroke="#3E7C59" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 55 L9 59 M28 55 L31 59 M20 52 V58" fill="none" stroke="#3E7C59" strokeWidth="3" strokeLinecap="round" />
          <path d="M45 12 C52 1 62 8 55 16 C51 20 45 17 45 12Z" fill="#6BBF8A" />
        </svg>
      </div>
      <div className="splash-word">Kroot</div>
    </div>
  );
}
