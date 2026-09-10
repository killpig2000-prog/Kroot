"use client";

import { SceneLayer, costumeById, skinFor, skyFor } from "@/lib/costumes";
import RoamingFriends from "@/components/dashboard/RoamingFriends";
import VeteranTree, { veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { FULLY_GROWN_LEVEL, treeStageForLevel } from "@/lib/level";
import type { CefrLevel } from "@/lib/tree";

// One tree, drawn one way (2026-09-10, user call). My room's hero and the
// phone Garden's card used to compose the garden separately, and the card
// only drew the creature: no veteran trunk past Lv.50, no sky costume, no
// ground items, no friends — 22 of the shop's 53 costumes never showed on
// the home screen. Both now render this stage, so what you equip in My
// room is what greets you on the Garden, at whatever size the caller asks.

/** The frame's shape for a level and outfit — shared so the pills, the
 *  scene's sky and the card's height agree with the drawing. */
export function gardenFrame(level: number, costumeIds: string[]) {
  const skin = skinFor(costumeIds);
  // Lv.50+: the trunk keeps growing, so the drawing gets taller. A skin
  // hides the tree, trunk included, so the frame stays 230 tall.
  const veteran = level >= FULLY_GROWN_LEVEL && !skin;
  const frameH = veteran ? veteranFrameHeight(level) : 230;
  return {
    veteran,
    frameH,
    /** ground items and friends ride down with the taller frame */
    groundShift: frameH - 230,
    /** a sky costume swaps the scene's gradient (and hides the clouds) */
    sky: skyFor(costumeIds),
    skin,
  };
}

export default function GardenStage({
  level,
  species,
  costumeIds,
  width,
  roamSpan,
  svgClassName = "",
}: {
  level: number;
  species?: CefrLevel;
  costumeIds: string[];
  /** CSS width of the tree's frame; height follows the frame. */
  width: string;
  /** How far friends wander sideways — smaller in a small card. */
  roamSpan?: string;
  /** Extra class on the tree's <svg> — the Garden card's cheer sway. */
  svgClassName?: string;
}) {
  const { veteran, frameH, groundShift, skin } = gardenFrame(level, costumeIds);
  const stage = treeStageForLevel(level);
  const skyGrounds = costumeIds.map(costumeById).filter((c) => c?.slot === "sky" && c.skyGround);
  return (
    <div className="relative" style={{ width }} data-garden-tree>
      <svg
        viewBox={`0 0 220 ${frameH}`}
        className={`block h-auto transition-[height] duration-500 ${svgClassName}`}
        style={{ width }}
        aria-hidden="true"
      >
        {/* a mound under the soil so costume ground items still sit on grass —
            the same green as GardenScene's ground (2026-09-10), so it vanishes
            into the meadow instead of showing as a paler patch */}
        <ellipse cx="110" cy={frameH + 4} rx="150" ry="34" fill="#5FA976" />
        {/* sky details (moon, stars, snow, rain) are drawn over the whole
            garden by SkyLayer, not in this frame */}
        <SceneLayer costumeIds={costumeIds} layer="behind" omitSlots={["sky"]} />
        {veteran && species ? (
          <VeteranTree level={level} species={species} costumeIds={costumeIds} />
        ) : (
          <LevelCreature level={stage} costumeIds={costumeIds} species={species} />
        )}
        {/* what a sky costume leaves on the ground at the tree's feet */}
        {skyGrounds.map((c) => (
          <g key={c!.id}>{c!.skyGround!()}</g>
        ))}
        {/* friends wander the garden instead (RoamingFriends), unless a skin hides the tree */}
        <SceneLayer costumeIds={costumeIds} layer="front" groundShift={groundShift} omitSlots={skin ? ["sky"] : ["friend", "sky"]} />
        <g className="bob">
          <circle cx="60" cy="78" r="6" fill="#FACC15" />
        </g>
        <g className="bob2">
          <circle cx="164" cy="72" r="6" fill="#FB7185" />
        </g>
      </svg>
      {/* the friends, in a box the same size as the tree's so their feet
          stay on the same ground line while they wander sideways */}
      {!skin && <RoamingFriends costumeIds={costumeIds} frameH={frameH} groundShift={groundShift} width={width} span={roamSpan} />}
    </div>
  );
}

/** A sky costume's details — the moon and stars, the snow, the rain and its
 *  clouds — across the whole garden (2026-09-10, user call: "박스 해제",
 *  then "배경 전체 다 쓰도록"). The gradient already filled the scene; the
 *  details used to sit in the tree's 220x230 frame, a box of stars around
 *  the tree. Each sky item draws its own `skyScene`: a wide field (stars, clouds, snow,
 *  rain) cropped to the scene's shape, and an orb (moon, sun) pinned
 *  top-right at a capped size — big on a phone, never huge on a desktop. Items
 *  without one fall back to their frame drawing, scaled to cover.
 *  Place it as a direct child of the GardenScene, before the tree. */
export function SkyLayer({ costumeIds }: { costumeIds: string[] }) {
  const sky = costumeIds.map(costumeById).filter((c) => c?.slot === "sky" && (c.skyScene || c.scene));
  if (sky.length === 0) return null;
  // z-0, before the tree in the DOM: over the hills, under the tree and its
  // friends (z-[1] put the Garden card's mist over the cat).
  return (
    <>
      {sky.map((c) => {
        const ss = c!.skyScene;
        if (!ss) {
          return (
            <svg key={c!.id} className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 220 230" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
              {c!.scene!.draw()}
            </svg>
          );
        }
        return (
          <span key={c!.id} className="contents">
            {ss.field && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 800 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
                {ss.field()}
              </svg>
            )}
            {ss.orb && (
              // top-right, under the pill row; a picture, so clamp()ed —
              // the min fits a 360px card, the max is reached by 430
              <svg
                className="absolute pointer-events-none z-0 right-[clamp(12px,4%,64px)] top-[clamp(52px,15%,76px)] w-[clamp(56px,17vw,84px)] h-auto"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {ss.orb()}
              </svg>
            )}
          </span>
        );
      })}
    </>
  );
}
