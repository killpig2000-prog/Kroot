import type { CSSProperties, ReactNode } from "react";

// The one garden every "moment" screen shares — first open (SeedIntro), the
// dashboard hero (TreeCard), session results, the growth popup, sign-up.
// Sky gradient + two hills + either clouds (dawn) or stars and a glow
// (night). Children are positioned by the caller; this only paints the
// backdrop, so a scene is never a different garden by accident.
//
// Light-only on purpose: it's a picture, not chrome. Text placed on it must
// use fixed inks (#2E5B41 / #4A4237 on dawn, cream on night), not tokens.

export const DAWN_SKY = "linear-gradient(180deg,#FFF9EC 0%,#EAF4F3 40%,#BEE3F0 62%,#DFF3E4 100%)";
export const NIGHT_SKY = "linear-gradient(180deg,#1B2A36 0%,#2B4358 38%,#7FB6C9 62%,#DFF3E4 100%)";

export default function GardenScene({
  tone = "dawn",
  className = "",
  style,
  hillsHeight = "44%",
  children,
}: {
  tone?: "dawn" | "night";
  className?: string;
  style?: CSSProperties;
  /** How much of the scene the hills take, from the bottom. */
  hillsHeight?: string;
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
        <svg className="absolute top-[14%] left-0 w-full h-[16%]" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
          <g fill="#FFFFFF" opacity=".8">
            <ellipse cx="62" cy="30" rx="26" ry="9" />
            <ellipse cx="84" cy="24" rx="17" ry="7" />
            <ellipse cx="318" cy="38" rx="22" ry="7.5" opacity=".7" />
          </g>
        </svg>
      )}
      <svg
        className="absolute left-[-4%] right-[-4%] bottom-0 w-[108%]"
        style={{ height: hillsHeight }}
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 110 C140 60 260 90 400 96 C540 102 660 50 800 92 L800 200 L0 200Z" fill={night ? "#9FCDB0" : "#CFE9D6"} />
        <path d="M0 150 C160 120 300 140 440 132 C600 122 700 140 800 128 L800 200 L0 200Z" fill="#B9DDC3" />
        <path d="M0 176 C200 160 400 172 800 164 L800 200 L0 200Z" fill="#DFF3E4" />
      </svg>
      {children}
    </div>
  );
}
