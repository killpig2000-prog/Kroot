"use client";

import type { CSSProperties } from "react";
import { roamingFriends } from "@/lib/costumes";

// The dashboard's friends don't sit at their spot — they wander. Each friend
// is drawn alone in a frame the same size as the tree's (so the ground line
// matches), laid exactly over the tree, and that whole frame strolls
// sideways on the grass: out toward its side of the garden, a pause, back,
// a longer pause. At the far end the friend turns around (a flip about its
// own anchor, not the frame's centre — otherwise it would jump to the other
// side of the tree). Fliers drift up and down a little on top. Cycles of
// different lengths mean two friends rarely move at the same moment, and
// reduced-motion keeps everyone where they are.
export default function RoamingFriends({
  costumeIds,
  frameH,
  groundShift,
  width,
  span: spanLength,
}: {
  costumeIds: string[];
  frameH: number;
  groundShift: number;
  /** CSS width of the tree's frame. */
  width: string;
  /** How far a friend walks, as a CSS length; the default suits the hero,
   *  a small card passes something shorter so nobody leaves the picture. */
  span?: string;
}) {
  const friends = roamingFriends(costumeIds);
  if (friends.length === 0) return null;
  return (
    <>
      {friends.map((c, i) => {
        const roam = c.roam!;
        const dir = roam.dir === "left" ? -1 : 1;
        // How far it goes: most of the garden (2026-09-10, user: "펫을 자유롭게"),
        // from beside the tree out toward that side's edge and back.
        const span = `calc(${dir} * ${spanLength ?? "clamp(96px, 30vw, 220px)"})`;
        const dur = `${26 + i * 7}s`;
        const delay = `${i * 9}s`;
        return (
          <div
            key={c.id}
            className="absolute inset-0 pointer-events-none motion-safe:animate-[roamX_var(--dur)_ease-in-out_infinite]"
            style={{ "--span": span, "--dur": dur, animationDelay: delay } as CSSProperties}
            aria-hidden="true"
          >
            <svg viewBox={`0 0 220 ${frameH}`} className="block h-auto" style={{ width }}>
              <g
                className="motion-safe:animate-[roamFace_var(--dur)_steps(1,end)_infinite]"
                style={{ transformOrigin: `${roam.x}px ${roam.y + groundShift}px`, transformBox: "view-box", animationDelay: delay } as CSSProperties}
              >
                <g className={roam.air ? "motion-safe:animate-[friendDrift_3.6s_ease-in-out_infinite]" : undefined}>
                  <g transform={groundShift ? `translate(0 ${groundShift})` : undefined}>{c.scene!.draw()}</g>
                </g>
              </g>
            </svg>
          </div>
        );
      })}
    </>
  );
}
