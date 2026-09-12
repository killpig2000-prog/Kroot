"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { playWater } from "@/lib/sfx";

// Review is watering what's already planted (2026-09-10, user call: option 3
// of four — not a header orb, not a second decorated button under the
// quest). A watering can rests on the grass at the garden's bottom-right, in
// My room and in the Garden card alike. Drawn in the garden's own hand: a
// round jug, a long spout with a big rose, flat two-tone fills and an edge
// in its own darker blue, like the tree beside it — a shaded, "3D" can was
// mocked and dropped because it looked like it came from another picture
// book, and the first boxy draft read as a bucket.
//
// It says how much is due without nagging: a small count sits on it when
// words are due; nothing due, it stands quiet; done for today, it lies
// tipped over. It moves on
// its own exactly once — one wobble when the garden opens with words due —
// then keeps still (the zero-nudge rule, promotion-eligibility 2026-09-05).
//
// Tap: it lifts over the tree and tips, three drops fall, a ripple spreads
// at the trunk, the caller makes the tree sway and say thanks, and the last
// ripple keeps growing until it covers the garden and /review opens. With
// reduced motion it just goes.

// Sky-blue enamel (2026-09-10, user pick of three: terracotta, sage, sky).
// The tree's own rules: flat fills, one shade step, a thin edge in the
// can's darker hue, one highlight — no ink line, no gradient.
const BASE = "#B5DCEA";
const SHADE = "#8EC4D8";
const EDGE = "#4E93AC";
const WATER = "#7FB6C9";
const WATER_DEEP = "#4E93AC";

export default function WateringCan({
  due,
  doneToday,
  onPour,
  className = "",
  style,
}: {
  /** Words due now, already capped at today's review cap. */
  due: number;
  /** Today's review cap (kept for callers; the drawing no longer shows a level). */
  cap?: number;
  /** Today's cap is reached: the can lies empty. */
  doneToday: boolean;
  /** Called as the water starts to fall — the caller sways its tree. */
  onPour?: () => void;
  /** Placement is the caller's (absolute, bottom-right of its garden). */
  className?: string;
  style?: CSSProperties;
}) {
  const t = useTranslations("dashboard.review");
  const router = useRouter();
  const btn = useRef<HTMLButtonElement>(null);
  const [fx, setFx] = useState<null | { x: number; top: number; ground: number }>(null);
  const [wash, setWash] = useState(false);
  const busy = useRef(false);

  const state: "due" | "none" | "done" = doneToday ? "done" : due > 0 ? "due" : "none";

  // the one wobble, on arrival, only when something is due
  useEffect(() => {
    if (state !== "due" || !btn.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = btn.current.animate(
      [{ rotate: "0deg" }, { rotate: "-8deg" }, { rotate: "6deg" }, { rotate: "-3deg" }, { rotate: "0deg" }],
      { duration: 1100, delay: 600, easing: "ease-in-out" },
    );
    return () => a.cancel();
  }, [state]);

  const go = () => router.push("/review");

  const pour = () => {
    const el = btn.current;
    if (!el || busy.current) return;
    busy.current = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      go();
      return;
    }
    // where the tree is, relative to the garden this can stands in
    const garden = el.parentElement!;
    const tree = garden.querySelector<HTMLElement>("[data-garden-tree]");
    const g = garden.getBoundingClientRect();
    const c = el.getBoundingClientRect();
    const tr = tree?.getBoundingClientRect() ?? { left: g.left + g.width * 0.3, top: g.top + g.height * 0.3, width: 100, height: 100, bottom: g.bottom - 36 };
    const dx = tr.left + tr.width * 0.62 - c.left;
    const dy = tr.top + tr.height * 0.05 - c.top;
    el.animate(
      [
        // opacity on every step, or the fade to 0 spans the whole flight
        { transform: "translate(0,0) rotate(0deg)", opacity: 1, offset: 0 },
        { transform: `translate(${dx}px,${dy}px) rotate(-10deg)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px,${dy}px) rotate(-40deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${dx}px,${dy}px) rotate(-40deg)`, opacity: 1, offset: 0.85 },
        { transform: `translate(${dx}px,${dy}px) rotate(-40deg)`, opacity: 0, offset: 1 },
      ],
      { duration: 1900, easing: "cubic-bezier(.45,.05,.3,1)", fill: "forwards" },
    );
    setTimeout(() => {
      setFx({ x: tr.left + tr.width * 0.5 - g.left, top: tr.top + tr.height * 0.12 - g.top, ground: tr.bottom - g.top });
      playWater();
      onPour?.();
    }, 700);
    setTimeout(() => setWash(true), 2150);
    setTimeout(go, 2500);
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        onClick={pour}
        aria-label={state === "due" ? t("due", { count: due }) : t("label")}
        className={`z-[6] min-w-[44px] cursor-pointer origin-[70%_85%] transition-transform hover:-translate-y-0.5 active:translate-y-[1px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success rounded-[10px] ${className}`}
        style={style}
      >
        <svg viewBox="0 0 96 80" className="block w-full h-auto overflow-visible" aria-hidden="true">
          {/* Mirrored (2026-09-12, user: "호스가 나무를 향해야"): the can stands
              at the garden's right, so the spout points left, at the tree,
              instead of off the edge of the picture. */}
          <g style={state === "done" ? { transform: "rotate(-24deg) translate(2px, 8px)", transformOrigin: "40px 72px" } : undefined}>
          <g transform="translate(96 0) scale(-1 1)">
            {/* the shadow on the grass */}
            <ellipse cx="42" cy="74" rx="30" ry="4" fill="#2E5B41" opacity=".13" />
            {/* spout: long, curving up, thicker at the body */}
            <path d="M58 52 C70 48 76 36 82 22" stroke={EDGE} strokeWidth="9" fill="none" strokeLinecap="round" />
            <path d="M58 52 C70 48 76 36 82 22" stroke={SHADE} strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M59 50 C69 46 74 36 79 24" stroke={BASE} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".9" />
            {/* the rose — the part that says "watering can" at 55px */}
            <g transform="rotate(-28 84 18)">
              <path d="M76 18 L92 12 L92 26 Z" fill={SHADE} stroke={EDGE} strokeWidth="1.6" strokeLinejoin="round" />
              <ellipse cx="92" cy="19" rx="4.2" ry="8.6" fill={BASE} stroke={EDGE} strokeWidth="1.6" />
              {[[92.4, 14.5], [92.4, 19], [92.4, 23.5], [90.6, 16.8], [90.6, 21.2]].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="0.95" fill={EDGE} />
              ))}
            </g>
            {/* handle, a band over the top */}
            <path d="M22 30 C22 8 56 8 58 30" stroke={EDGE} strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M22 30 C22 8 56 8 58 30" stroke={BASE} strokeWidth="4.6" fill="none" strokeLinecap="round" />
            {/* body: a round jug, wider at the hips, one shade step on the right */}
            <path d="M18 34 C16 30 20 26 26 26 L54 26 C60 26 64 30 62 34 L66 62 C67 70 60 72 54 72 L26 72 C18 72 12 70 13 62 Z" fill={BASE} stroke={EDGE} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M48 26 L54 26 C60 26 64 30 62 34 L66 62 C67 70 60 72 54 72 L46 72 C54 64 55 44 48 26 Z" fill={SHADE} />
            <path d="M14.5 56 C28 60 52 60 65.2 56" stroke={SHADE} strokeWidth="3" fill="none" />
            <path d="M14.5 56 C28 60 52 60 65.2 56" stroke={EDGE} strokeWidth="1" fill="none" opacity=".55" />
            {/* the opening */}
            <ellipse cx="40" cy="27" rx="15" ry="3.6" fill={SHADE} stroke={EDGE} strokeWidth="1.6" />
            <ellipse cx="40" cy="27.4" rx="10" ry="2" fill={EDGE} opacity=".45" />
            {/* one highlight */}
            <path d="M22 36 C20 44 20 52 22 60" stroke="#FFFDF6" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity=".7" />
            <circle cx="23" cy="32.5" r="1.8" fill="#FFFDF6" opacity=".7" />
          </g>
          </g>
        </svg>
        {state === "due" && (
          <span
            className="absolute -top-[6px] -right-[4px] min-w-[20px] h-[20px] rounded-full px-[5px] text-[11px] leading-[16px] font-extrabold text-white tabular-nums border-2 border-cream"
            style={{ background: WATER_DEEP }}
          >
            {due}
          </span>
        )}
      </button>

      {/* the water: three drops, then the ripple that becomes the review */}
      {fx && (
        <div className="absolute inset-0 pointer-events-none z-[7]" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <i
              key={i}
              className="absolute block w-[6px] h-[10px] rounded-[50%] animate-[wcDrop_.55s_linear_infinite]"
              style={
                {
                  left: fx.x - 4 + i * 4,
                  top: fx.top,
                  background: WATER,
                  animationDelay: `${i * 0.18}s`,
                  "--fall": `${Math.max(40, fx.ground - fx.top)}px`,
                } as CSSProperties
              }
            />
          ))}
          <i
            className="absolute block w-[8px] h-[4px] rounded-[50%] border-2 animate-[wcRing_1.1s_ease-out_2]"
            style={{ left: fx.x, top: fx.ground - 2, borderColor: WATER_DEEP }}
          />
          <i
            className={`absolute block w-[20px] h-[20px] rounded-full transition-transform duration-[450ms] ease-in ${wash ? "scale-[60]" : "scale-0"}`}
            style={{ left: fx.x - 10, top: fx.ground - 10, background: WATER }}
          />
        </div>
      )}
    </>
  );
}
