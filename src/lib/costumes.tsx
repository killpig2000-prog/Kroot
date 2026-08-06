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
  A1: { hat: { x: 110, y: 163, s: 0.8 }, face: { x: 110, y: 186, s: 0.65 }, neck: { x: 110, y: 205, s: 0.7 } },
  A2: { hat: { x: 110, y: 121, s: 0.75 }, face: { x: 110, y: 139, s: 0.6 }, neck: { x: 110, y: 157, s: 0.65 } },
  B1: { hat: { x: 110, y: 52, s: 1 }, face: { x: 110, y: 108, s: 1 }, neck: { x: 110, y: 132, s: 1 } },
  B2: { hat: { x: 110, y: 32, s: 1.1 }, face: { x: 110, y: 100, s: 1.1 }, neck: { x: 110, y: 126, s: 1.1 } },
  C1: { hat: { x: 110, y: 32, s: 1.1 }, face: { x: 110, y: 100, s: 1.1 }, neck: { x: 110, y: 126, s: 1.1 } },
  C2: { hat: { x: 110, y: 32, s: 1.1 }, face: { x: 110, y: 100, s: 1.1 }, neck: { x: 110, y: 126, s: 1.1 } },
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
