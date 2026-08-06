"use client";

import { useSyncExternalStore } from "react";

// Greets by the visitor's local clock — the server can't know their timezone.
function greetingForHour(hour: number): string {
  if (hour < 5) return "Up late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const emptySubscribe = () => () => {};

export default function Greeting({ name }: { name: string }) {
  // The server can't know the visitor's clock, so it renders a neutral
  // "Welcome"; useSyncExternalStore swaps in the local-time greeting right
  // after hydration (a mismatched useState initializer would be discarded
  // under suppressHydrationWarning and the server text would stick).
  const hour = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getHours(),
    () => -1
  );
  const greeting = hour < 0 ? "Welcome" : greetingForHour(hour);

  return (
    <h1
      suppressHydrationWarning
      className="font-semibold text-[clamp(20px,2.4vw,24px)] tracking-[-0.02em] mb-0.5"
    >
      {greeting}, {name}
    </h1>
  );
}
