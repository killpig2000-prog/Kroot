"use client";

import { useEffect } from "react";

/**
 * Makes the browser/Android Back button close an overlay instead of leaving
 * the page. Opening pushes a history entry; Back pops it and closes.
 *
 * Same mechanism the onboarding wizard uses for its steps. It matters most in
 * the Play Store wrapper, where Back is a hardware button and a bottom sheet
 * that ignores it drops the learner out of the screen they were on.
 *
 * `close` must be stable (useCallback or a plain setter), otherwise the entry
 * is pushed again on every render.
 */
export function useBackToClose(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;

    // Remember where we were: if the overlay closes because a link inside it
    // navigated somewhere, the entry we pushed is no longer ours to undo, and
    // calling back() would cancel that navigation.
    const openedAt = window.location.pathname;
    let owned = true;

    window.history.pushState({ ...window.history.state, kroot_overlay: true }, "");

    const onPop = () => {
      owned = false;
      close();
    };
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("popstate", onPop);
      if (owned && window.location.pathname === openedAt) {
        // Closed from the UI, still on the same page: drop our entry so Back
        // doesn't have to be pressed twice to leave.
        window.history.back();
      }
    };
  }, [open, close]);
}
