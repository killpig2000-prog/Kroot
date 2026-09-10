"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { playWater } from "@/lib/sfx";

// Review is watering what's already planted (2026-09-10, user call: option 3
// of four — not a header orb, not a second decorated button under the
// quest). A watering can rests on the grass at the garden's bottom-right, in
// My room and in the Garden card alike. Drawn in the garden's own hand: flat
// two-tone fills and one ink line, like the tree beside it — a shaded, "3D"
// can was mocked and dropped because it looked like it came from another
// picture book.
//
// It says how much is due without nagging: the water inside is the share of
// today's cap still to go and a small count sits on it; nothing due, it is
// full and quiet; done for today, it lies tipped over and empty. It moves on
// its own exactly once — one wobble when the garden opens with words due —
// then keeps still (the zero-nudge rule, promotion-eligibility 2026-09-05).
//
// Tap: it lifts over the tree and tips, three drops fall, a ripple spreads
// at the trunk, the caller makes the tree sway and say thanks, and the last
// ripple keeps growing until it covers the garden and /review opens. With
// reduced motion it just goes.

const INK = "#2E5B41";
const WATER = "#7FB6C9";
const WATER_DEEP = "#4E93AC";

export default function WateringCan({
  due,
  cap,
  doneToday,
  onPour,
  className = "",
  style,
}: {
  /** Words due now, already capped at today's review cap. */
  due: number;
  /** Today's review cap — the water level is due / cap. */
  cap: number;
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
  // water height in the can's 0..1 belly; a sliver when empty so the line reads
  const level = state === "done" ? 0.08 : state === "none" ? 1 : Math.min(1, Math.max(0.25, due / Math.max(cap, 1)));

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
        <svg viewBox="0 0 64 56" className="block w-full h-auto overflow-visible" aria-hidden="true">
          <g style={state === "done" ? { transform: "rotate(-24deg) translate(2px, 8px)", transformOrigin: "30px 50px" } : undefined}>
            {/* the shadow on the grass */}
            <ellipse cx="28" cy="52" rx="20" ry="3" fill={INK} opacity=".14" />
            {/* spout, behind the body */}
            <path d="M44 34 L58 20" stroke={INK} strokeWidth="6.4" strokeLinecap="round" />
            <path d="M44 34 L58 20" stroke="#DDEBDF" strokeWidth="3" strokeLinecap="round" />
            <path d="M55 15.5 l6 6" stroke={INK} strokeWidth="5.4" strokeLinecap="round" />
            <path d="M55 15.5 l6 6" stroke="#EAF3EC" strokeWidth="2.2" strokeLinecap="round" />
            {/* handle */}
            <path d="M16 20 Q28 3 40 20" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* body: lit left, one step of shade right, water inside */}
            <clipPath id="wc-belly">
              <path d="M10 22 Q10 19 13 19 L43 19 Q46 19 46 22 L47 46 Q47 49 44 49 L12 49 Q9 49 9 46 Z" />
            </clipPath>
            <g clipPath="url(#wc-belly)">
              <rect x="8" y="18" width="40" height="32" fill="#EAF3EC" />
              <rect x="31" y="18" width="17" height="32" fill="#D3E6D8" />
              <rect x="8" y={19 + 30 * (1 - level)} width="40" height={31 * level + 1} fill={WATER} />
              <rect x="31" y={19 + 30 * (1 - level)} width="17" height={31 * level + 1} fill={WATER_DEEP} opacity=".35" />
              <path d={`M8 ${19 + 30 * (1 - level)} q5 -1.6 10 0 t10 0 t10 0 t10 0`} stroke="#FFFDF6" strokeWidth="1.2" fill="none" opacity=".8" />
            </g>
            <path d="M10 22 Q10 19 13 19 L43 19 Q46 19 46 22 L47 46 Q47 49 44 49 L12 49 Q9 49 9 46 Z" fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
            {/* the rim */}
            <path d="M11 19.5 L45 19.5" stroke={INK} strokeWidth="3.2" strokeLinecap="round" />
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
