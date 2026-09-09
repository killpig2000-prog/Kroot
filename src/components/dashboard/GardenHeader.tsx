"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { greetingKey } from "@/lib/tree-phrases";

const emptySubscribe = () => () => {};

// The phone Garden's first line: the greeting, by the visitor's clock. The
// streak and coin pills that sat beside it for a day (option 2a) moved up
// into the status bar (Sidebar's phone header) on 2026-09-10 — user call:
// numbers belong in the chrome, not next to the learner's name — which also
// hands the greeting the full width, so a long name no longer truncates at
// "Good morning, Revi…".
//
// The server can't know the visitor's clock, so it renders "Welcome" and
// the local-time greeting swaps in right after hydration — the same trick
// TreeCard's bubble uses.
export default function GardenHeader({ displayName }: { displayName: string }) {
  const tu = useTranslations("ui");
  const hour = useSyncExternalStore(emptySubscribe, () => new Date().getHours(), () => -1);

  return (
    <h1
      className="hand mb-3 min-w-0 truncate font-semibold text-success-deep"
      style={{ fontSize: "clamp(18px, 5.6vw, 22px)" }}
    >
      {tu(greetingKey(hour))}, {displayName}
    </h1>
  );
}
