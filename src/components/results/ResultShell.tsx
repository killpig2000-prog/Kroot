"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import GardenScene from "@/components/ui/GardenScene";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { levelProgress, treeStageForLevel } from "@/lib/level";
import { useTranslations } from "next-intl";
import type { ProgressResult } from "@/lib/activity";
import { playChapterClear, playCoin, playDayComplete, playLevelUp, playWater } from "@/lib/sfx";

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
  sound = "chapter",
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
  /**
   * Which finish sound this screen makes. "chapter" (default) is the cleared
   * arpeggio, "water" the review drop, "day" the vocabulary Day chime,
   * "none" for callers that play their own. A level-up always overrides;
   * coins landing add a short jingle after. Plays once, when the server's
   * reward result arrives (it lands async, after first paint).
   */
  sound?: "chapter" | "water" | "day" | "none";
}) {
  const tu = useTranslations("ui");
  const played = useRef(false);
  useEffect(() => {
    if (played.current || sound === "none" || !levelUp) return;
    played.current = true;
    if (levelUp.leveled_up) {
      playLevelUp();
      return;
    }
    // A score too low to pay is not a cleared chapter — stay quiet.
    if (levelUp.coins_blocked === "score" || (!levelUp.coins_blocked && levelUp.coins_pending)) return;
    if (sound === "water") playWater();
    else if (sound === "day") playDayComplete();
    else playChapterClear();
    if ((levelUp.coins_earned ?? 0) > 0) setTimeout(playCoin, 550);
  }, [sound, levelUp]);
  // Older deployed award_xp versions don't return points_awarded; fall back
  // to the skill's rate so the strip still reads correctly against them.
  const xpAwarded = levelUp?.points_awarded;
  // Why no coins landed. coins_blocked (migration 0074) names the actual
  // reason; before it existed the screen could only guess "score too low",
  // which was wrong advice for the two cases a better score can't fix — a
  // capped day, or content below the learner's level. coins_pending is the
  // pre-0074 fallback: still correct that coins are unpaid, just unable to
  // say why, so it keeps showing the score hint as it always did.
  const blocked = levelUp?.coins_blocked ?? (levelUp?.coins_pending ? "score" : null);
  const coinsPossible = levelUp?.coins_possible ?? 15;

  // The garden: the learner's own tree (stage from the level the server just
  // reported), a watering can tipping over it while the XP line on the grass
  // fills from where it was to where it is now. Species isn't known here, so
  // the creature wears its stage's default species.
  const stage = levelUp ? treeStageForLevel(levelUp.new_level) : null;
  const after = levelUp ? levelProgress(levelUp.new_xp) : null;
  const gained = xpAwarded ?? (levelUp ? xpValue : 0);
  const before = levelUp ? levelProgress(Math.max(0, levelUp.new_xp - gained)) : null;
  // The bar rests where it was for a second, then shows the XP about to land
  // as a pale stretch from there to where it's going, then fills along it
  // (2026-09-12, user call — it used to start filling at once). A level-up
  // fills to the end first, then the new level starts from empty. Water
  // falls only while XP actually landed.
  const leveled = !!before && !!after && before.level !== after.level;
  const startPct = before ? before.pct : 0;
  const [bar, setBar] = useState<{ fill: number; ghost: number | null; instant: boolean } | null>(null);
  const [watering, setWatering] = useState(false);
  useEffect(() => {
    if (!levelUp || !after) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      at(0, () => setBar({ fill: after.pct, ghost: null, instant: true }));
    } else {
      const target = leveled ? 100 : after.pct;
      at(0, () => setBar({ fill: startPct, ghost: null, instant: true }));
      at(1000, () => setBar({ fill: startPct, ghost: target, instant: false }));
      at(1400, () => setBar({ fill: target, ghost: target, instant: false }));
      if (leveled) {
        at(3000, () => setBar({ fill: 0, ghost: null, instant: true }));
        at(3100, () => setBar({ fill: 0, ghost: after.pct, instant: false }));
        at(3400, () => setBar({ fill: after.pct, ghost: after.pct, instant: false }));
      }
    }
    if (gained > 0) at(0, () => setWatering(true));
    at(2000, () => setWatering(false));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelUp]);
  const shown = bar ?? { fill: startPct, ghost: null, instant: true };

  return (
    <div
      className="max-w-[640px] w-full border border-line rounded-[16px] bg-cream overflow-hidden"
      style={{ animation: "fadeUp .4s ease" }}
    >
      <GardenScene className="h-[clamp(300px,80vw,350px)]" hillsHeight="40%">
        {/* what happened, in one breath */}
        <div className="absolute left-0 right-0 top-4 px-4 text-center z-[4]">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold tracking-[.08em] uppercase" style={{ color }}>
            <span className="w-[8px] h-[8px] rounded-full flex-none" style={{ background: color }} />
            {categoryLabel}
            {meta && <span className="normal-case tracking-normal font-bold" style={{ color: "#8C8272" }}>· {meta}</span>}
          </span>
          <h2 className="font-bold text-[clamp(18px,5vw,21px)] tracking-[-0.02em] mt-1.5" style={{ color: "#2E5B41", textWrap: "balance" }}>
            {headline}
          </h2>
          {sub && (
            <p className="text-[12.5px] font-semibold mt-1" style={{ color: "#6B6560" }}>
              {sub}
            </p>
          )}
        </div>

        {/* the score ring, shrunk to a corner badge */}
        {ring && (
          <div className="absolute top-3 right-3 z-[5] w-[82px] h-[82px] pointer-events-none" aria-hidden="true">
            <div className="origin-top-left scale-[.6]">{ring}</div>
          </div>
        )}

        {/* the tree, and the water it just earned */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[54px] z-[3] w-[clamp(140px,36vw,190px)]">
          {stage ? (
            <svg viewBox="0 0 220 230" className="w-full h-auto" aria-hidden="true">
              <LevelCreature level={stage} playerLevel={levelUp?.new_level} />
            </svg>
          ) : (
            <div className="aspect-[220/230]" />
          )}
        </div>
        {watering && (
          <div className="absolute z-[4] left-[calc(50%-96px)] top-[38%] pointer-events-none" aria-hidden="true">
            <svg viewBox="0 0 80 60" className="w-[64px] h-auto motion-safe:animate-[canTilt_1.2s_ease-in-out_infinite]" style={{ transformOrigin: "70% 30%" }}>
              <path d="M18 22h34a6 6 0 0 1 6 6v20a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6V28a6 6 0 0 1 6-6z" fill="#7BA8C9" />
              <path d="M58 30l16-14" stroke="#7BA8C9" strokeWidth="6" strokeLinecap="round" />
              <circle cx="76" cy="14" r="6" fill="#9CC3DD" />
              <path d="M12 30q-10 8 0 16" stroke="#7BA8C9" strokeWidth="5" fill="none" strokeLinecap="round" />
            </svg>
            <div className="absolute left-[64px] top-[6px]">
              {[0, 8, -6, 14].map((x, i) => (
                <i
                  key={i}
                  className="absolute w-[6px] h-[9px] rounded-[50%_50%_50%_50%/60%_60%_40%_40%] bg-[#7CC4E8] motion-safe:animate-[waterDrop_1.3s_linear_infinite]"
                  style={{ left: x, animationDelay: `${i * 0.33}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* one XP line on the grass */}
        <div className="absolute left-4 right-4 bottom-3 z-[4]">
          <div className="flex items-center justify-between gap-3 text-[11.5px] font-extrabold tabular-nums" style={{ color: "#2E5B41" }}>
            <span className={xpAwarded === 0 ? "opacity-60" : ""}>
              +{xpAwarded ?? xpValue} XP <span className="font-bold" style={{ color: "#6B6560" }}>· {levelUp?.already_earned ? tu("alreadyEarned") : xpLabel}</span>
            </span>
            {after && (
              <span>
                {after.into}/{after.needed} · Lv.{after.level}
              </span>
            )}
          </div>
          <div className="relative mt-1 h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(255,253,246,.7)" }}>
            {/* the XP about to land, pale, from the bar's end to where it's going */}
            <i
              className="not-italic absolute inset-y-0 left-0 rounded-full bg-success transition-opacity duration-300"
              style={{ width: `${shown.ghost ?? shown.fill}%`, opacity: shown.ghost === null ? 0 : 0.3 }}
            />
            <i
              className={`not-italic relative block h-full rounded-full bg-success ${
                shown.instant ? "" : "transition-[width] duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)]"
              }`}
              style={{ width: `${shown.fill}%` }}
            />
          </div>
        </div>
      </GardenScene>

      {/* tags + coins, one quiet row under the scene */}
      <div className="flex flex-wrap items-center gap-1.5 px-[18px] py-3">
        {tags}
        <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap bg-[var(--tint-amber)] border-amber-line text-[#B7791F]">
          {(levelUp?.coins_earned ?? 0) > 0 ? tu("coinsEarned", { n: levelUp!.coins_earned }) : <span className="text-faint">{tu("noCoinsThisTime")}</span>}
        </span>
      </div>

      {levelUp?.leveled_up && (
        <div className="flex items-center gap-2.5 px-[18px] py-2.5 border-t border-b border-success-line bg-success-bg">
          <span className="text-[19px] flex-none">🎉</span>
          <p className="text-[13.5px] font-bold text-success-deep">{tu("levelUp", { level: levelUp.new_level })}</p>
        </div>
      )}

      {blocked && (
        <p className="px-[18px] py-2.5 text-[12.5px] font-semibold text-amber bg-[var(--tint-amber)] border-t border-amber-line">
          {blocked === "score"
            ? `🪙 ${tu("scoreForCoin", { n: 60, coins: coinsPossible })}`
            : blocked === "daily_cap"
              ? `✅ ${tu("coinsCappedToday")}`
              : `📘 ${tu("coinsBelowLevel")}`}
        </p>
      )}

      {children && <div className="p-[clamp(18px,3vw,26px)] flex flex-col gap-3.5 border-t border-line">{children}</div>}

      {actions && <div className="flex flex-wrap gap-2.5 px-[18px] py-4 border-t border-line bg-warm">{actions}</div>}
    </div>
  );
}
