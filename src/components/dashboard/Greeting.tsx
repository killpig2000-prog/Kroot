"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

// Greets by the visitor's local clock — the server can't know their timezone.
function greetingKey(hour: number): "upLate" | "goodMorning" | "goodAfternoon" | "goodEvening" {
  if (hour < 5) return "upLate";
  if (hour < 12) return "goodMorning";
  if (hour < 18) return "goodAfternoon";
  return "goodEvening";
}

const emptySubscribe = () => () => {};

export default function Greeting({ name }: { name: string }) {
  const t = useTranslations("ui");
  // The server can't know the visitor's clock, so it renders a neutral
  // "Welcome"; useSyncExternalStore swaps in the local-time greeting right
  // after hydration (a mismatched useState initializer would be discarded
  // under suppressHydrationWarning and the server text would stick).
  const hour = useSyncExternalStore(
    emptySubscribe,
    () => new Date().getHours(),
    () => -1
  );
  const greeting = hour < 0 ? t("welcome") : t(greetingKey(hour));

  return (
    <h1
      suppressHydrationWarning
      className="font-semibold text-[clamp(20px,2.4vw,24px)] tracking-[-0.02em] mb-0.5"
    >
      {greeting}, {name}
    </h1>
  );
}
