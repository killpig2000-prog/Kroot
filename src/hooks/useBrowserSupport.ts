"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

// SSR-safe browser-capability check: true on the server (so markup matches),
// the real answer on the client — without a setState-in-effect cascade.
export function useBrowserSupport(check: () => boolean) {
  return useSyncExternalStore(subscribeNever, check, () => true);
}
