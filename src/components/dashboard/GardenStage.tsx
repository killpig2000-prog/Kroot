"use client";

import { SceneLayer, skinFor, skyFor } from "@/lib/costumes";
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
  return (
    <div className="relative" style={{ width }} data-garden-tree>
      <svg
        viewBox={`0 0 220 ${frameH}`}
        className={`block h-auto transition-[height] duration-500 ${svgClassName}`}
        style={{ width }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="tc-hill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CDE8C2" />
            <stop offset="100%" stopColor="#BBDCAE" />
          </linearGradient>
        </defs>
        {/* a soft mound under the soil so costume ground items still sit on grass */}
        <ellipse cx="110" cy={frameH + 4} rx="150" ry="34" fill="url(#tc-hill)" />
        <SceneLayer costumeIds={costumeIds} layer="behind" />
        {veteran && species ? (
          <VeteranTree level={level} species={species} costumeIds={costumeIds} />
        ) : (
          <LevelCreature level={stage} costumeIds={costumeIds} species={species} />
        )}
        {/* friends wander the garden instead (RoamingFriends), unless a skin hides the tree */}
        <SceneLayer costumeIds={costumeIds} layer="front" groundShift={groundShift} omitSlots={skin ? undefined : ["friend"]} />
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
