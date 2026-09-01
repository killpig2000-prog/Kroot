"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Makes the browser/Android Back button close an overlay instead of leaving
 * the page. Opening pushes a history entry; Back pops it and closes.
 *
 * Same mechanism the onboarding wizard uses for its steps. It matters most in
 * the Play Store wrapper, where Back is a hardware button and a bottom sheet
 * that ignores it drops the learner out of the screen they were on.
 *
 * Returns `dismiss`, which UI closers (a scrim tap, an X, Escape) should call
 * instead of their own close: it goes back, which pops the entry and closes
 * through the same path, leaving the history clean.
 *
 * The cleanup deliberately does NOT pop the entry itself. An earlier version
 * did, guarded by a pathname comparison, and it cancelled navigation: tapping
 * a link inside the sheet closed the sheet, the cleanup ran before the router
 * had committed the new URL, and back() undid the very navigation the learner
 * asked for. Verified against production — the link went nowhere. Leaving the
 * entry is harmless: it carries the same URL, so popping it later just shows
 * the page without the overlay.
 *
 * `close` must be stable (useCallback or a plain setter).
 */
export function useBackToClose(open: boolean, close: () => void) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!open) return;

    window.history.pushState({ ...window.history.state, kroot_overlay: true }, "");
    pushed.current = true;

    const onPop = () => {
      pushed.current = false;
      close();
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, close]);

  return useCallback(() => {
    if (pushed.current) {
      // popstate closes it; going back also disposes of the entry we added.
      window.history.back();
    } else {
      close();
    }
  }, [close]);
}
