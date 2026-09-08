"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import Glyph from "@/components/dashboard/Glyph";
import { greetingKey } from "@/lib/tree-phrases";

const emptySubscribe = () => () => {};

// The phone Garden's first line, option 2a (2026-09-09): the greeting on
// the left, the streak and the coins as two small pills on the right. Both
// numbers used to ride inside TreeBand; the garden card that replaced it is
// a picture, so they moved out here where they read as chrome.
//
// The server can't know the visitor's clock, so it renders "Welcome" and
// the local-time greeting swaps in right after hydration — the same trick
// TreeCard's bubble uses.
export default function GardenHeader({
  displayName,
  streakDays,
  coins,
}: {
  displayName: string;
  streakDays: number;
  coins: number;
}) {
  const tu = useTranslations("ui");
  const ti = useTranslations("profile.identity");
  const hour = useSyncExternalStore(emptySubscribe, () => new Date().getHours(), () => -1);

  const pill =
    "inline-flex items-center gap-1 px-2.5 py-[5px] rounded-full bg-cream border border-line text-[13px] font-extrabold text-success tabular-nums";

  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      {/* clamp()ed so a long name still fits a 360px phone next to the pills */}
      <h1
        className="hand min-w-0 truncate font-semibold text-success-deep"
        style={{ fontSize: "clamp(18px, 5.6vw, 22px)" }}
      >
        {tu(greetingKey(hour))}, {displayName}
      </h1>
      <div className="flex-none flex items-center gap-1.5">
        <span className={pill} aria-label={ti("streak", { n: streakDays })}>
          <Glyph name="flame" className="w-[14px] h-[14px]" /> {streakDays}
        </span>
        <span className={pill} aria-label={ti("coins", { n: coins })}>
          <Glyph name="coin" className="w-[14px] h-[14px]" /> {coins}
        </span>
      </div>
    </div>
  );
}
