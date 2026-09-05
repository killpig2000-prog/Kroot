"use client";

import { useCallback, useRef, useState } from "react";

/**
 * One async user action — a tap that writes something — with the two guards
 * this codebase kept getting wrong by hand:
 *
 *   1. Re-entrancy. A ref (not the `busy` state) blocks the second tap, so a
 *      double-click can't fire two writes in the same render.
 *   2. Release. The busy flag is cleared in `finally`, so a *throw* (offline,
 *      DNS blip, a dropped connection mid-request) can't leave the button
 *      disabled forever. Hand-written versions kept releasing only on the
 *      happy path, or only when Supabase returned `{ error }` — a rejected
 *      promise skipped the release and stranded the learner until a reload.
 *
 * `failed` is set when the action threw, so the caller can render a real
 * message instead of the tap looking like it did nothing. Callers that want
 * to distinguish failure kinds should catch inside `fn` and set their own
 * state; anything that escapes `fn` lands here.
 */
export function useAsyncAction<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void>,
  label = "async action"
) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = useCallback(
    async (...args: Args) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(true);
      setFailed(false);
      try {
        await fn(...args);
      } catch (err) {
        console.error(`${label} failed:`, err instanceof Error ? err.message : err);
        setFailed(true);
      } finally {
        inFlight.current = false;
        setBusy(false);
      }
    },
    [fn, label]
  );

  const clearFailed = useCallback(() => setFailed(false), []);

  return { run, busy, failed, clearFailed };
}
