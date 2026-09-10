import type { CSSProperties, ReactNode } from "react";

// The one garden every "moment" screen shares — first open (SeedIntro), the
// dashboard hero (TreeCard), session results, the growth popup, sign-up.
// Sky gradient + a far ridge + two hills + either clouds, a sun and a
// meadow (dawn) or stars and a glow (night). Children are positioned by the caller; this only paints the
// backdrop, so a scene is never a different garden by accident.
//
// Light-only on purpose: it's a picture, not chrome. Text placed on it must
// use fixed inks (#2E5B41 / #4A4237 on dawn, cream on night), not tokens.

// Where the meadow's pieces stand: [left %, bottom %] on the middle hill,
// birds as [left %, top %]. Ratios, so the same meadow fits a 214px card
// and a 960px hero.
const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315];
// Solid ground (2026-09-10, user call: "단색 하나 크룻색 좍 칠하고 그 위에 잔디·꽃"):
// the three pale hill bands are gone. One meadow green with a single curved
// top edge, and the grass is what sits on it — tufts and wildflowers —
// all drawn darker than the ground, the way grass reads on a lawn. No
// vines (user call), so the flowers took their spots.
const GROUND = "#5FA976";
const GRASS = "#2E5B41";
const TUFTS: [number, number, boolean][] = [[7, 24, false], [24, 19, true], [41, 27, false], [58, 20, false], [73, 26, true], [88, 18, false], [96, 25, false], [20, 11, false], [36, 9, true], [70, 12, false], [94, 8, false]];
const FLOWERS: [number, number, string][] = [[14, 22, "#F4A7B9"], [31, 27, "#FFD66B"], [49, 19, "#FFFDF6"], [64, 25, "#F4A7B9"], [80, 21, "#FFD66B"], [92, 28, "#FFFDF6"], [12, 8, "#FFD66B"], [62, 6, "#F4A7B9"], [86, 10, "#FFFDF6"]];
const BIRDS: [number, number][] = [[28, 17], [35, 24]];

export const DAWN_SKY = "linear-gradient(180deg,#FFF9EC 0%,#EAF4F3 40%,#BEE3F0 62%,#DFF3E4 100%)";
export const NIGHT_SKY = "linear-gradient(180deg,#1B2A36 0%,#2B4358 38%,#7FB6C9 62%,#DFF3E4 100%)";

export default function GardenScene({
  tone = "dawn",
  className = "",
  style,
  hillsHeight = "44%",
  clouds = true,
  children,
}: {
  tone?: "dawn" | "night";
  className?: string;
  style?: CSSProperties;
  /** How much of the scene the hills take, from the bottom. */
  hillsHeight?: string;
  /** Dawn only: drop the clouds when the caller paints its own sky (a sky costume). */
  clouds?: boolean;
  children?: ReactNode;
}) {
  const night = tone === "night";
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: night ? NIGHT_SKY : DAWN_SKY, ...style }}>
      {night ? (
        <>
          <svg className="absolute inset-0 w-full h-full" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 400 400">
            {[[56, 48], [120, 80], [288, 36], [344, 88], [208, 60], [248, 108], [30, 130], [372, 150]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="#FFFDF6" opacity=".8" />
            ))}
          </svg>
          <div
            className="absolute left-1/2 top-[58%] w-[260px] h-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,244,200,.85), rgba(255,244,200,0) 70%)" }}
            aria-hidden="true"
          />
        </>
      ) : (
        <>
          {clouds && (
            <>
              <svg className="absolute top-[14%] left-0 w-full h-[16%]" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
                <g fill="#FFFFFF" opacity=".8">
                  <ellipse cx="62" cy="30" rx="26" ry="9" />
                  <ellipse cx="84" cy="24" rx="17" ry="7" />
                  <ellipse cx="318" cy="38" rx="22" ry="7.5" opacity=".7" />
                </g>
              </svg>
              {/* The sun — what made this "dawn" rather than a pretty sky
                  (2026-09-10). A picture, so sized like the tree: clamp()ed
                  off the container, the min fits a 360px card, the max is
                  reached by 430 and a desktop hero gets more sky, not a
                  bigger sun. A solid halo stands in for glow: no alpha. Goes
                  with the clouds, so a sky costume that paints its own
                  weather drops both. */}
              <svg
                className="absolute left-[47%] top-[3%]"
                style={{ width: "clamp(60px, 17%, 80px)" }}
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <g fill="#FFF3CF">
                  {SUN_RAYS.map((a, i) => (
                    <path
                      key={a}
                      transform={`rotate(${a} 50 50)`}
                      d={i % 2 ? "M48.6 17 L51.4 17 L51.6 7 Q50 5 48.4 7 Z" : "M48.6 17 L51.4 17 L52.2 3 Q50 1 47.8 3 Z"}
                    />
                  ))}
                </g>
                <circle cx="50" cy="50" r="31" fill="#FFF3CF" />
                <circle cx="50" cy="50" r="22" fill="#FFE9A3" />
                <circle cx="50" cy="50" r="22" fill="none" stroke="#FFE1A0" strokeWidth="1.4" />
              </svg>
            </>
          )}
        </>
      )}
      <svg
        className="absolute left-[-4%] right-[-4%] bottom-0 w-[108%]"
        style={{ height: hillsHeight }}
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {night ? (
          <>
            <path d="M0 110 C140 60 260 90 400 96 C540 102 660 50 800 92 L800 200 L0 200Z" fill="#9FCDB0" />
            <path d="M0 150 C160 120 300 140 440 132 C600 122 700 140 800 128 L800 200 L0 200Z" fill="#B9DDC3" />
            <path d="M0 176 C200 160 400 172 800 164 L800 200 L0 200Z" fill="#DFF3E4" />
          </>
        ) : (
          /* one ground, one colour; the top edge is the only terrain */
          <path d="M0 40 C150 10 300 34 420 30 C560 26 680 6 800 30 L800 200 L0 200Z" fill={GROUND} />
        )}
      </svg>
      {/* The meadow: grass tufts, wildflowers and two birds, so the tree
          stands in a place rather than on a colour. Small fixed-size pieces
          placed by ratio — a wide hero gets more meadow, not a stretched
          one — behind whatever the caller stands on the hills. Dawn only:
          the night scene has its own stars. */}
      {!night && (
        <>
          {TUFTS.map(([x, b, tall]) => (
            <svg
              key={`t${x}`}
              className="absolute -translate-x-1/2"
              style={{ left: `${x}%`, bottom: `${b}%`, width: "clamp(18px, 5%, 24px)" }}
              viewBox="0 0 24 16"
              aria-hidden="true"
            >
              <path
                d={`M12 15 q-3 -6 -8 -9 M12 15 q0 -8 ${tall ? 2 : 1} -13 M12 15 q3 -5 8 -8`}
                fill="none"
                stroke={GRASS}
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ))}
          {FLOWERS.map(([x, b, c]) => (
            <svg
              key={`f${x}`}
              className="absolute -translate-x-1/2"
              style={{ left: `${x}%`, bottom: `${b}%`, width: "clamp(7px, 2%, 9px)" }}
              viewBox="0 0 10 10"
              aria-hidden="true"
            >
              <circle cx="5" cy="5" r="4.6" fill={c} />
              <circle cx="5" cy="5" r="1.6" fill="#FFF3CF" />
            </svg>
          ))}
          {BIRDS.map(([x, t]) => (
            <svg
              key={`b${x}`}
              className="absolute"
              style={{ left: `${x}%`, top: `${t}%`, width: "clamp(12px, 3.5%, 16px)" }}
              viewBox="0 0 20 8"
              aria-hidden="true"
            >
              <path d="M1 6 q4 -5 9 0 q4 -5 9 0" fill="none" stroke="#5E9E74" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          ))}
        </>
      )}
      {children}
    </div>
  );
}
