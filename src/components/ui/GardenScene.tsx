import type { CSSProperties, ReactNode } from "react";

// The one backdrop every "moment" screen shares — the dashboard card and
// My room (through TreeCard/GardenCard), session results, the growth popup,
// sign-up, the ranking podium. Children are positioned by the caller; this
// only paints the backdrop, so a scene is never a different place by accident.
//
// Studio (2026-09-13, user call, from the backdrop mockup): a soft cream
// that turns mint towards the edges, and nothing else — no sun, clouds,
// hills or meadow. The tree art is a soft 3D render and the flat vector
// meadow never sat right next to it; on a plain studio ground the tree is
// the picture. The tree brings its own sand disc to stand on (GardenStage),
// and a sky costume still paints over this through the caller's `style`.
// Night (the growth popup) keeps its stars, glow and hills.
//
// Light-only on purpose: it's a picture, not chrome. Text placed on it must
// use fixed inks (#2E5B41 / #4A4237 on studio, cream on night), not tokens.

export const STUDIO_BG = "radial-gradient(120% 90% at 50% 22%, #FFFDF6 0%, #F4EFE3 55%, #E4EFE0 100%)";
export const NIGHT_SKY = "linear-gradient(180deg,#1B2A36 0%,#2B4358 38%,#7FB6C9 62%,#DFF3E4 100%)";

export default function GardenScene({
  tone = "studio",
  className = "",
  style,
  hillsHeight = "44%",
  children,
}: {
  tone?: "studio" | "night";
  className?: string;
  style?: CSSProperties;
  /** Night only: how much of the scene the hills take, from the bottom. */
  hillsHeight?: string;
  /** No longer drawn (the studio has no clouds); kept so a sky costume's
      caller can still say it paints its own weather. */
  clouds?: boolean;
  children?: ReactNode;
}) {
  const night = tone === "night";
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: night ? NIGHT_SKY : STUDIO_BG, ...style }}>
      {night && (
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
          <svg
            className="absolute left-[-4%] right-[-4%] bottom-0 w-[108%]"
            style={{ height: hillsHeight }}
            viewBox="0 0 800 200"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 110 C140 60 260 90 400 96 C540 102 660 50 800 92 L800 200 L0 200Z" fill="#9FCDB0" />
            <path d="M0 150 C160 120 300 140 440 132 C600 122 700 140 800 128 L800 200 L0 200Z" fill="#B9DDC3" />
            <path d="M0 176 C200 160 400 172 800 164 L800 200 L0 200Z" fill="#DFF3E4" />
          </svg>
        </>
      )}
      {children}
    </div>
  );
}
