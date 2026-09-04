"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { ProgressResult } from "@/lib/activity";

// Shared shell for every "session finished" screen: category ribbon, hero
// (ring/creature + headline + tags), level-up banner, XP/coins reward strip,
// a category-specific slot, then actions. Streak and elapsed time aren't
// shown — neither is tracked anywhere upstream, so the strip only surfaces
// numbers the app actually has (XP, coins, level).
const CIRC = 2 * Math.PI * 52;

export function ResultRing({
  pct,
  center,
  unit,
  label,
  color,
}: {
  pct: number;
  center: ReactNode;
  unit?: string;
  label: string;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  // Committing 0% on the first paint, then the real value a frame later, is
  // what makes the CSS transition below actually animate on mount — setting
  // the final offset straight away leaves the browser no "before" value to
  // interpolate from, so the ring used to just appear already full.
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDisplay(clamped));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [clamped]);
  const offset = CIRC - (display / 100) * CIRC;
  return (
    <div className="relative w-[136px] h-[136px] flex-none mx-auto sm:mx-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="font-bold text-[32px] leading-none tracking-[-0.02em] tabular-nums">
          {center}
          {unit && <small className="text-[13px] text-faint font-semibold">{unit}</small>}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[.08em] text-faint mt-1.5">{label}</div>
      </div>
    </div>
  );
}

export function ResultTag({
  tone = "neutral",
  children,
}: {
  tone?: "good" | "warn" | "bad" | "neutral";
  children: ReactNode;
}) {
  const cls =
    tone === "good"
      ? "bg-success-bg border-success-line text-success-deep"
      : tone === "warn"
      ? "bg-[var(--tint-amber)] border-amber-line text-amber"
      : tone === "bad"
      ? "bg-[var(--tint-rose)] border-[var(--tint-rose-line)] text-danger"
      : "bg-warm border-line text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
}

export default function ResultShell({
  color,
  categoryLabel,
  meta,
  ring,
  headline,
  sub,
  tags,
  levelUp,
  xpValue,
  xpLabel,
  actions,
  children,
}: {
  color: string;
  categoryLabel: string;
  meta?: string;
  ring?: ReactNode;
  headline: ReactNode;
  sub?: ReactNode;
  tags?: ReactNode;
  levelUp: ProgressResult | null;
  xpValue: number;
  xpLabel: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const tu = useTranslations("ui");
  // Older deployed award_xp versions don't return points_awarded; fall back
  // to the skill's rate so the strip still reads correctly against them.
  const xpAwarded = levelUp?.points_awarded;
  // coins_pending (migration 0065) means this item's coins are still there
  // to earn — scoring 60%+ on some future attempt pays them, once. It stays
  // true across repeated low scores even after XP itself has been maxed out
  // (already_earned alone would wrongly read this chapter as fully done).
  const missedAccuracyGate = !!levelUp?.coins_pending;
  return (
    <div
      className="max-w-[640px] w-full border border-line rounded-[16px] bg-cream overflow-hidden"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <div className="flex items-center gap-2 px-[18px] py-3 border-b border-dashed border-line text-[12.5px] font-bold text-muted flex-wrap">
        <span className="inline-flex items-center gap-1.5" style={{ color }}>
          <span className="w-[9px] h-[9px] rounded-full flex-none" style={{ background: color }} />
          {categoryLabel}
        </span>
        {meta && (
          <>
            <span className="text-faint">·</span>
            <span>{meta}</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-5 items-center p-[clamp(18px,3vw,26px)] text-center sm:text-left">
        {ring}
        <div>
          <h2 className="font-bold text-[20px] sm:text-[21px] tracking-[-0.02em]" style={{ textWrap: "balance" }}>
            {headline}
          </h2>
          {sub && <p className="text-sm text-muted mt-1.5">{sub}</p>}
          {tags && <div className="flex flex-wrap gap-1.5 mt-3 justify-center sm:justify-start">{tags}</div>}
        </div>
      </div>

      {levelUp?.leveled_up && (
        <div className="flex items-center gap-2.5 px-[18px] py-2.5 border-t border-b border-success-line bg-success-bg">
          <span className="text-[19px] flex-none">🎉</span>
          <p className="text-[13.5px] font-bold text-success-deep">{tu("levelUp", { level: levelUp.new_level })}</p>
        </div>
      )}

      <div className="grid grid-cols-2 divide-x divide-line border-t border-line bg-warm">
        <div className="px-4 py-3">
          {/* The real number the server paid, when it said — `xpValue` is the
              skill's full rate, which a replay of an already-rewarded chapter
              does not earn (migration 0063). Showing the rate there would
              promise XP that never arrived. */}
          <b
            className={`block text-[19px] font-bold leading-tight tabular-nums ${
              xpAwarded === 0 ? "text-faint" : "text-success"
            }`}
          >
            +{xpAwarded ?? xpValue} XP
          </b>
          <small className="text-xs text-muted">{levelUp?.already_earned ? tu("alreadyEarned") : xpLabel}</small>
        </div>
        <div className="px-4 py-3">
          {(levelUp?.coins_earned ?? 0) > 0 ? (
            <>
              <b className="block text-[19px] font-bold text-[#B7791F] leading-tight tabular-nums">
                {tu("coinsEarned", { n: levelUp!.coins_earned })}
              </b>
              <small className="text-xs text-muted">{tu("coinsEarnedLabel")}</small>
            </>
          ) : (
            <>
              <b className="block text-[19px] font-bold text-faint leading-tight">—</b>
              <small className="text-xs text-muted">{tu("noCoinsThisTime")}</small>
            </>
          )}
        </div>
      </div>

      {missedAccuracyGate && (
        <p className="px-[18px] py-2.5 text-[12.5px] font-semibold text-amber bg-[var(--tint-amber)] border-t border-amber-line">
          🪙 {tu("scoreForCoin", { n: 60, coins: 15 })}
        </p>
      )}

      {children && <div className="p-[clamp(18px,3vw,26px)] flex flex-col gap-3.5 border-t border-line">{children}</div>}

      {actions && <div className="flex flex-wrap gap-2.5 px-[18px] py-4 border-t border-line bg-warm">{actions}</div>}
    </div>
  );
}
