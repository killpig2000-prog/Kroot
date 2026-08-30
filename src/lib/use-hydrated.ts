"use client";

import { useEffect, useState } from "react";

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
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
