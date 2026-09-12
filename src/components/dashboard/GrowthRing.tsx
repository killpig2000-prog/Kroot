"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { TONE, type DayDepth, type WeekRing } from "@/lib/growth-rings";

// The ring itself — one drawing at three sizes: the streak pill's 20px icon,
// the Garden card's picture, the sheet's full cross-section. Always a 100×100
// viewBox; the caller sizes it with a class or style (pictures clamp() off
// the viewport — AGENTS.md rule 2 — icons stay fixed).
//
// Outer ring: this week, seven segments clockwise from Monday at the top,
// each toned by how deep that day went (lib/growth-rings TONE). Inside it,
// optionally, the closed weeks as full rings — a thicker band for a week
// with more days, a richer tone for deeper days — around a pith.
//
// Wood colours are fixed hex on purpose: it's a picture, like GardenScene,
// not chrome. The empty track is the one token, so it sits on the card.

const C = 50;

function arc(r: number, a0: number, a1: number) {
  const s = ((a0 - 90) * Math.PI) / 180;
  const e = ((a1 - 90) * Math.PI) / 180;
  const x0 = C + r * Math.cos(s);
  const y0 = C + r * Math.sin(s);
  const x1 = C + r * Math.cos(e);
  const y1 = C + r * Math.sin(e);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// A week's band: two units for existing at all, one per day shown up, and
// up to six more for the XP earned — the wide rings are the good weeks.
function bandUnits(w: { attended: number; xp?: number }) {
  return 2 + w.attended + Math.min(6, Math.floor((w.xp ?? 0) / 100));
}

function mixTone(v: number) {
  const lo = Math.max(0, Math.min(3, Math.floor(v))) as DayDepth;
  const hi = Math.min(3, lo + 1) as DayDepth;
  const t = v - lo;
  const a = TONE[lo === 0 ? 1 : lo];
  const b = TONE[hi === 0 ? 1 : hi];
  if (!a.startsWith("#") || !b.startsWith("#")) return a;
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a);
  const B = p(b);
  return `#${A.map((x, i) => Math.round(x + (B[i] - x) * t).toString(16).padStart(2, "0")).join("")}`;
}

export default function GrowthRing({
  week,
  today,
  past = [],
  ring = "card",
  animateToday = false,
  markToday = false,
  className = "",
  style,
  label,
  level = 0,
}: {
  /** Mon..Sun depths for the outer ring */
  week: DayDepth[];
  /** 0 = Monday … 6 = Sunday */
  today: number;
  /** closed weeks, newest first, drawn inward */
  past?: Pick<WeekRing, "attended" | "avg" | "xp">[];
  /** The tree's level decides the heartwood: an elder tree (Lv.33+) has a
   *  dark heart, the Guardian Tree (Lv.50, the max) a gold one — so two
   *  twelve-week trees at different levels don't cut the same (2026-09-10;
   *  thresholds moved to the looks with the max-Lv.50 curve, 2026-09-12). */
  level?: number;
  /** stroke proportions per placement */
  ring?: "icon" | "card" | "sheet";
  /** draw today's segment in (the first open of the day) */
  animateToday?: boolean;
  /** a green hairline outside today's segment */
  markToday?: boolean;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  const outerW = ring === "icon" ? 22 : ring === "card" ? 14 : 12;
  const gap = ring === "icon" ? 10 : ring === "card" ? 6 : 5;
  const R = C - outerW / 2 - 1;
  const seg = 360 / 7;

  // The draw-in: today's segment starts hidden and its dash offset eases to
  // zero one frame after mount, so the first open of the day is seen
  // happening rather than already done.
  const [drawn, setDrawn] = useState(!animateToday);
  useEffect(() => {
    if (!animateToday) return;
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, [animateToday]);

  const innerR = R - outerW / 2 - 2;
  const pith = level >= 33 ? 6 : 5;
  const heart = level >= 50 ? { fill: "#4A3320", gold: true } : level >= 33 ? { fill: "#5C4228", gold: false } : { fill: "#8A6A45", gold: false };
  let rings: { r: number; band: number; tone: string }[] = [];
  if (past.length) {
    const total = past.reduce((a, w) => a + bandUnits(w), 0);
    const scale = (innerR - pith) / total;
    let r = pith;
    // oldest innermost
    rings = [...past].reverse().map((w) => {
      const band = bandUnits(w) * scale;
      r += band;
      return { r, band, tone: w.attended ? mixTone(w.avg) : TONE[0] };
    });
  }

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {past.length > 0 ? (
        <>
          <circle cx={C} cy={C} r={innerR} fill="var(--c-warm-3)" />
          {rings.map((k, i) => (
            <g key={i}>
              <circle cx={C} cy={C} r={k.r - k.band / 2} fill="none" stroke={k.tone} strokeWidth={k.band} />
              <circle cx={C} cy={C} r={k.r} fill="none" stroke="#5C4228" strokeWidth={0.5} opacity={0.28} />
            </g>
          ))}
          <circle cx={C} cy={C} r={pith} fill={heart.fill} />
          {heart.gold && <circle cx={C} cy={C} r={pith + 1.2} fill="none" stroke="#B7791F" strokeWidth={0.9} />}
        </>
      ) : ring !== "icon" ? (
        <circle cx={C} cy={C} r={8} fill={heart.fill} />
      ) : null}

      {week.map((v, i) => {
        const a0 = i * seg + gap / 2;
        const a1 = (i + 1) * seg - gap / 2;
        const isToday = i === today;
        const animating = isToday && animateToday;
        return (
          <path
            key={i}
            d={arc(R, a0, a1)}
            fill="none"
            stroke={TONE[v]}
            strokeWidth={outerW}
            pathLength={animating ? 100 : undefined}
            strokeDasharray={animating ? "100 100" : undefined}
            strokeDashoffset={animating ? (drawn ? 0 : 100) : undefined}
            style={animating ? { transition: "stroke-dashoffset .8s cubic-bezier(.22,.8,.3,1) .3s" } : undefined}
          />
        );
      })}

      {markToday && (
        <path
          d={arc(R + outerW / 2 + 2, today * seg + gap / 2, (today + 1) * seg - gap / 2)}
          fill="none"
          stroke="var(--c-success)"
          strokeWidth={ring === "icon" ? 4 : 2.2}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
