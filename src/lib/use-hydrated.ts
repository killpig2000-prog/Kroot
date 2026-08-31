"use client";

import { useSyncExternalStore } from "react";

/**
 * False on the server and on the first client render, true once the component
 * has hydrated.
 *
 * Forms whose only submit handling is React's `onSubmit` need this: until the
 * page hydrates, that handler doesn't exist, so a submit falls through to the
 * browser's native one. Gating the submit button on this keeps the form inert
 * rather than half-working during that window — see the auth forms, where a
 * native submit used to put the password in the URL.
 */
// useSyncExternalStore rather than useEffect+setState: the server snapshot is
// false and the client snapshot is true, so React resolves the difference
// during hydration itself instead of scheduling a second render pass. The old
// shape tripped react-hooks/set-state-in-effect and cost every gated form a
// cascading render. Nothing ever changes after hydration, so the subscribe
// callback has nothing to listen to.
const neverChanges = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    neverChanges,
    () => true,
    () => false
  );
}
