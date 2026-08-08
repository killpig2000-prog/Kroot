import type { ReactNode } from "react";
import type { CefrLevel } from "@/lib/tree";

export type CostumeSlot = "hat" | "face" | "neck";

export type Costume = {
  id: string;
  name: string;
  krName: string;
  slot: CostumeSlot;
  price: number;
  // Minimum tree level required to wear it (costumes scale with the tree).
  minLevel?: CefrLevel;
  // Claimable only with an active Kroot Plus subscription (enforced server-side).
  plusOnly?: boolean;
  // Drawn centered on (0,0) in a roughly 70x40 box; scaled/positioned per level.
  render: () => ReactNode;
};

export const COSTUMES: Costume[] = [
  {
    id: "straw-hat",
    name: "Straw Hat",
    krName: "밀짚모자",
    slot: "hat",
    price: 40,
    render: () => (
      <>
        <ellipse cx="0" cy="6" rx="34" ry="9" fill="#EFD48A" />
        <path d="M-18 4 C-18 -12 18 -12 18 4 Z" fill="#F5DFA0" />
        <path d="M-18 1 Q0 7 18 1" stroke="#D96A44" strokeWidth="5" fill="none" />
      </>
    ),
  },
  {
    id: "beanie",
    name: "Cozy Beanie",
    krName: "털모자",
    slot: "hat",
    price: 35,
    render: () => (
      <>
        <path d="M-19 6 C-19 -14 19 -14 19 6 Z" fill="#F2789A" />
        <rect x="-20" y="3" width="40" height="8" rx="4" fill="#FFD6E5" />
        <circle cx="0" cy="-14" r="5" fill="#FFD6E5" />
      </>
    ),
  },
  {
    id: "crown",
    name: "Royal Crown",
    krName: "왕관",
    slot: "hat",
    price: 150,
    minLevel: "C1",
    render: () => (
      <>
        <path d="M-16 6 L-16 -8 L-8 -1 L0 -12 L8 -1 L16 -8 L16 6 Z" fill="#FFD66B" stroke="#E0B23F" strokeWidth="2" />
        <circle cx="0" cy="-12" r="3" fill="#FF6B5B" />
        <circle cx="-16" cy="-8" r="2.5" fill="#8FCBDF" />
        <circle cx="16" cy="-8" r="2.5" fill="#8FCBDF" />
      </>
    ),
  },
  {
    id: "sprout-cap",
    name: "Sprout Cap",
    krName: "새싹 모자",
    slot: "hat",
    price: 25,
    render: () => (
      <>
        <path d="M-17 6 C-17 -10 17 -10 17 6 Z" fill="#6BBF8A" />
        <path d="M0 -8 C0 -16 6 -21 14 -22 C12 -14 7 -9 0 -8Z" fill="#5AB07E" />
        <path d="M0 -8 C0 -14 -5 -18 -11 -19 C-10 -13 -5 -9 0 -8Z" fill="#7FCB99" />
      </>
    ),
  },
  {
    id: "round-glasses",
    name: "Round Glasses",
    krName: "동글 안경",
    slot: "face",
    price: 30,
    render: () => (
      <>
        <circle cx="-11" cy="0" r="8" fill="rgba(255,255,255,.35)" stroke="#5E4A34" strokeWidth="2.5" />
        <circle cx="11" cy="0" r="8" fill="rgba(255,255,255,.35)" stroke="#5E4A34" strokeWidth="2.5" />
        <path d="M-3 0 Q0 -3 3 0" stroke="#5E4A34" strokeWidth="2.5" fill="none" />
      </>
    ),
  },
  {
    id: "sunglasses",
    name: "Cool Shades",
    krName: "선글라스",
    slot: "face",
    price: 55,
    minLevel: "B1",
    render: () => (
      <>
        <rect x="-19" y="-6" width="16" height="11" rx="5" fill="#3E3226" />
        <rect x="3" y="-6" width="16" height="11" rx="5" fill="#3E3226" />
        <path d="M-3 -2 Q0 -5 3 -2" stroke="#3E3226" strokeWidth="3" fill="none" />
        <circle cx="-14" cy="-3" r="2" fill="#fff" opacity=".5" />
        <circle cx="8" cy="-3" r="2" fill="#fff" opacity=".5" />
      </>
    ),
  },
  {
    id: "cozy-scarf",
    name: "Cozy Scarf",
    krName: "목도리",
    slot: "neck",
    price: 35,
    render: () => (
      <>
        <path d="M-16 -3 Q0 6 16 -3 L16 4 Q0 13 -16 4 Z" fill="#FF9E7D" />
        <rect x="6" y="2" width="9" height="16" rx="4" fill="#FF9E7D" />
        <path d="M6 14 L15 14" stroke="#E0805F" strokeWidth="2" />
      </>
    ),
  },
  {
    id: "gardener-halo",
    name: "Gardener's Halo",
    krName: "정원사의 후광",
    slot: "hat",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <ellipse cx="0" cy="-12" rx="20" ry="6" fill="none" stroke="#FFD66B" strokeWidth="4" />
        <ellipse cx="0" cy="-12" rx="20" ry="6" fill="none" stroke="#FFF3C4" strokeWidth="1.5" />
        <circle cx="-14" cy="-16" r="1.6" fill="#FFF3C4" />
        <circle cx="15" cy="-9" r="1.4" fill="#FFF3C4" />
      </>
    ),
  },
  {
    id: "star-glasses",
    name: "Star Glasses",
    krName: "별 안경",
    slot: "face",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <path d="M-11 -8 L-8.5 -2.5 L-3 -2 L-7 2 L-6 8 L-11 5 L-16 8 L-15 2 L-19 -2 L-13.5 -2.5 Z" fill="#FFD66B" stroke="#E0B23F" strokeWidth="1.5" />
        <path d="M11 -8 L13.5 -2.5 L19 -2 L15 2 L16 8 L11 5 L6 8 L7 2 L3 -2 L8.5 -2.5 Z" fill="#FFD66B" stroke="#E0B23F" strokeWidth="1.5" />
        <path d="M-3 0 Q0 -3 3 0" stroke="#E0B23F" strokeWidth="2.5" fill="none" />
      </>
    ),
  },
  {
    id: "golden-scarf",
    name: "Golden Scarf",
    krName: "황금 목도리",
    slot: "neck",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <path d="M-16 -3 Q0 6 16 -3 L16 4 Q0 13 -16 4 Z" fill="#FFD66B" />
        <rect x="6" y="2" width="9" height="16" rx="4" fill="#FFD66B" />
        <path d="M6 14 L15 14" stroke="#E0B23F" strokeWidth="2" />
        <circle cx="-8" cy="2" r="1.5" fill="#FFF3C4" />
        <circle cx="2" cy="4" r="1.5" fill="#FFF3C4" />
      </>
    ),
  },
  {
    id: "blossom-crown",
    name: "Blossom Crown",
    krName: "벚꽃 화관",
    slot: "hat",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <path d="M-18 2 Q0 -10 18 2" stroke="#7FA86B" strokeWidth="3.5" fill="none" />
        {[-15, -7.5, 0, 7.5, 15].map((x, i) => {
          const y = -2 - Math.cos((x / 15) * 1.2) * 5;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle cx="0" cy="-3" r="2.6" fill="#F9C4D4" />
              <circle cx="2.8" cy="-0.9" r="2.6" fill="#F9C4D4" />
              <circle cx="1.7" cy="2.4" r="2.6" fill="#FBD5E0" />
              <circle cx="-1.7" cy="2.4" r="2.6" fill="#F9C4D4" />
              <circle cx="-2.8" cy="-0.9" r="2.6" fill="#FBD5E0" />
              <circle cx="0" cy="0" r="1.4" fill="#F2789A" />
            </g>
          );
        })}
      </>
    ),
  },
  {
    id: "seonbi-gat",
    name: "Scholar's Gat",
    krName: "선비 갓",
    slot: "hat",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <ellipse cx="0" cy="5" rx="30" ry="7" fill="#2E2A26" opacity=".92" />
        <path d="M-11 5 C-11 -14 11 -14 11 5 Z" fill="#3E3226" />
        <path d="M-11 5 C-11 -14 11 -14 11 5 Z" fill="none" stroke="#5E4A34" strokeWidth="1" />
        <ellipse cx="0" cy="5" rx="30" ry="7" fill="none" stroke="#5E4A34" strokeWidth="1" />
        <path d="M-8 9 L-6 20 M8 9 L6 20" stroke="#3E3226" strokeWidth="1.5" />
      </>
    ),
  },
  {
    id: "moon-spectacles",
    name: "Moon Spectacles",
    krName: "달 안경",
    slot: "face",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <path d="M-11 -8 A8 8 0 1 0 -11 8 A6.2 6.2 0 1 1 -11 -8 Z" fill="#FFD66B" stroke="#E0B23F" strokeWidth="1.5" />
        <path d="M11 -8 A8 8 0 1 1 11 8 A6.2 6.2 0 1 0 11 -8 Z" fill="#FFD66B" stroke="#E0B23F" strokeWidth="1.5" />
        <path d="M-4 0 Q0 -3 4 0" stroke="#E0B23F" strokeWidth="2.5" fill="none" />
        <circle cx="-16" cy="-6" r="1.2" fill="#FFF3C4" />
        <circle cx="16" cy="6" r="1.2" fill="#FFF3C4" />
      </>
    ),
  },
  {
    id: "cherry-blush",
    name: "Cherry Blush",
    krName: "앵두 볼터치",
    slot: "face",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <ellipse cx="-13" cy="3" rx="5.5" ry="3.8" fill="#F2789A" opacity=".55" />
        <ellipse cx="13" cy="3" rx="5.5" ry="3.8" fill="#F2789A" opacity=".55" />
        <path d="M-15 1 L-11 1 M13.5 1 L10.5 4" stroke="#E4557E" strokeWidth="1.2" opacity=".5" strokeLinecap="round" />
        <path d="M0 -7 L1.2 -4.6 L3.6 -4.4 L1.8 -2.8 L2.3 -0.4 L0 -1.7 L-2.3 -0.4 L-1.8 -2.8 L-3.6 -4.4 L-1.2 -4.6 Z" fill="#FFD66B" />
      </>
    ),
  },
  {
    id: "hanbok-ribbon",
    name: "Hanbok Ribbon",
    krName: "한복 고름",
    slot: "neck",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <path d="M-16 -3 Q0 5 16 -3 L16 3 Q0 11 -16 3 Z" fill="#FBD5E0" />
        <path d="M-2 2 L-13 -4 L-13 6 Z" fill="#E4557E" />
        <circle cx="0" cy="3" r="3.2" fill="#DB2777" />
        <path d="M2 4 C6 6 7 12 6 19 L1 18 C2 12 2 8 2 4 Z" fill="#E4557E" />
        <path d="M2 4 C5 6 5 12 4 18" stroke="#C13A63" strokeWidth="1" fill="none" />
      </>
    ),
  },
  {
    id: "maple-garland",
    name: "Maple Garland",
    krName: "단풍 목걸이",
    slot: "neck",
    price: 0,
    plusOnly: true,
    render: () => (
      <>
        <path d="M-16 -2 Q0 8 16 -2" stroke="#8A6B4A" strokeWidth="2" fill="none" />
        {[
          { x: -13, y: 0, c: "#EFA75C" },
          { x: -6.5, y: 3, c: "#D96A44" },
          { x: 0, y: 4, c: "#C94F35" },
          { x: 6.5, y: 3, c: "#EFA75C" },
          { x: 13, y: 0, c: "#D96A44" },
        ].map((leaf, i) => (
          <path
            key={i}
            d={`M${leaf.x} ${leaf.y} l-3 3 l2.2 0.4 l-1 3 l1.8 -1 l0 2.6 l1.6 -2 l1.6 2 l0 -2.6 l1.8 1 l-1 -3 l2.2 -0.4 Z`}
            fill={leaf.c}
          />
        ))}
      </>
    ),
  },
  {
    id: "bow-tie",
    name: "Bow Tie",
    krName: "나비넥타이",
    slot: "neck",
    price: 28,
    render: () => (
      <>
        <circle cx="0" cy="0" r="3.5" fill="#B7A6E3" />
        <path d="M-3 0 L-14 -7 L-14 7 Z" fill="#9B7FD4" />
        <path d="M3 0 L14 -7 L14 7 Z" fill="#9B7FD4" />
      </>
    ),
  },
];

export function costumeById(id: string) {
  return COSTUMES.find((c) => c.id === id);
}

// Where each slot sits on the level creature (TreeCard's 220x230 viewBox).
// The creature's head moves and grows with the level, so anchors do too.
export const COSTUME_ANCHORS: Record<CefrLevel, Record<CostumeSlot, { x: number; y: number; s: number }>> = {
  // Sized so a hat reads as headwear, not a pin: at every stage the hat brim
  // spans most of the head/canopy it sits on.
  A1: { hat: { x: 110, y: 156, s: 1.5 }, face: { x: 110, y: 186, s: 1.0 }, neck: { x: 110, y: 203, s: 1.1 } },
  A2: { hat: { x: 110, y: 115, s: 1.4 }, face: { x: 110, y: 139, s: 0.9 }, neck: { x: 110, y: 156, s: 1.0 } },
  B1: { hat: { x: 110, y: 56, s: 2.2 }, face: { x: 110, y: 108, s: 1.5 }, neck: { x: 110, y: 134, s: 1.7 } },
  B2: { hat: { x: 110, y: 38, s: 2.6 }, face: { x: 110, y: 100, s: 1.7 }, neck: { x: 110, y: 127, s: 2.0 } },
  C1: { hat: { x: 110, y: 38, s: 2.6 }, face: { x: 110, y: 100, s: 1.7 }, neck: { x: 110, y: 127, s: 2.0 } },
  C2: { hat: { x: 110, y: 38, s: 2.6 }, face: { x: 110, y: 100, s: 1.7 }, neck: { x: 110, y: 127, s: 2.0 } },
};

// Renders equipped costumes at the right spot for the level. Place inside the
// creature's swaying <g> so outfits move with the tree.
export function CostumeLayer({ level, costumeIds }: { level: CefrLevel; costumeIds: string[] }) {
  return (
    <>
      {costumeIds.map((id) => {
        const costume = costumeById(id);
        if (!costume) return null;
        const a = COSTUME_ANCHORS[level][costume.slot];
        return (
          <g key={id} transform={`translate(${a.x} ${a.y}) scale(${a.s})`}>
            {costume.render()}
          </g>
        );
      })}
    </>
  );
}
