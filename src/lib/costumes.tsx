import type { ReactNode } from "react";
import type { CefrLevel } from "@/lib/tree";


// Wearables sit on the tree at a per-stage anchor; garden slots dress the
// scene around it (aura/sky behind the tree, ground/friend in front).
export type CostumeSlot = "hat" | "face" | "neck" | "aura" | "sky" | "ground" | "friend";
export const WEARABLE_SLOTS: CostumeSlot[] = ["hat", "face", "neck"];
export const GARDEN_SLOTS: CostumeSlot[] = ["aura", "sky", "ground", "friend"];
export const SLOT_LABELS: Record<CostumeSlot, { en: string; icon: string }> = {
  hat: { en: "Hats", icon: "🎩" },
  face: { en: "Face", icon: "👓" },
  neck: { en: "Neck", icon: "🧣" },
  aura: { en: "Aura", icon: "✨" },
  sky: { en: "Sky", icon: "🌤" },
  ground: { en: "Ground", icon: "🌼" },
  friend: { en: "Friend", icon: "🐦" },
};

export type Rarity = "common" | "rare" | "epic" | "legendary";
export const RARITY_LABEL: Record<Rarity, string> = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };

export type Costume = {
  id: string;
  name: string;
  krName: string;
  slot: CostumeSlot;
  price: number;
  rarity: Rarity;
  /** Emoji used where the item has no wearable drawing (wardrobe chips). */
  icon?: string;
  // Minimum player level (Lv.) required to buy it — the same axis the tree grows on.
  minPlayerLevel?: number;
  // Claimable only with an active Kroot Plus subscription (enforced server-side).
  plusOnly?: boolean;
  // Limited-time: on sale only inside this window (ISO dates, UTC). Mirrors
  // costume_catalog.available_from/until, enforced in buy_costume().
  availableFrom?: string;
  availableUntil?: string;
  // Wearables: drawn centered on (0,0) in a roughly 70x40 box; scaled/positioned per level.
  render?: () => ReactNode;
  // Garden items: drawn straight into the 220x230 tree frame. `behind` goes
  // under the tree (auras, sky details), `front` over it (ground, friends).
  scene?: { layer: "behind" | "front"; draw: () => ReactNode };
  // Sky items also swap the frame's background gradient (CSS value).
  sky?: string;
};

// Precomputed so server and client render byte-identical path strings.
const SUNBEAM_RAYS: string[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const f = (n: number) => n.toFixed(1);
  return `M110 120 L${f(110 + Math.cos(a) * 160)} ${f(120 + Math.sin(a) * 160)} L${f(110 + Math.cos(a + 0.18) * 160)} ${f(120 + Math.sin(a + 0.18) * 160)}Z`;
});

export const COSTUMES: Costume[] = [
  {
    id: "straw-hat",
    name: "Straw Hat",
    krName: "밀짚모자",
    slot: "hat",
    price: 40,
    rarity: "common",
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
    rarity: "common",
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
    rarity: "epic",
    minPlayerLevel: 45,
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
    rarity: "common",
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
    rarity: "common",
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
    rarity: "rare",
    minPlayerLevel: 20,
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
    rarity: "common",
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
    rarity: "rare",
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
    rarity: "rare",
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
    rarity: "rare",
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
    rarity: "epic",
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
    rarity: "epic",
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
    rarity: "rare",
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
    rarity: "common",
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
    rarity: "epic",
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
    rarity: "rare",
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
    rarity: "common",
    render: () => (
      <>
        <circle cx="0" cy="0" r="3.5" fill="#B7A6E3" />
        <path d="M-3 0 L-14 -7 L-14 7 Z" fill="#9B7FD4" />
        <path d="M3 0 L14 -7 L14 7 Z" fill="#9B7FD4" />
      </>
    ),
  },

  {
    id: "tiger-hood",
    name: "Tiger Hood",
    krName: "호랑이 모자",
    slot: "hat",
    price: 110,
    rarity: "rare",
    render: () => (
      <>
        <path d="M-20 8 C-20 -12 20 -12 20 8Z" fill="#F5A742" />
        <path d="M-12 -4 l4 8 M0 -8 l0 10 M12 -4 l-4 8" stroke="#3A2A1A" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="-16" cy="-4" r="5" fill="#F5A742" />
        <circle cx="16" cy="-4" r="5" fill="#F5A742" />
        <circle cx="-16" cy="-4" r="2.5" fill="#FFD6B0" />
        <circle cx="16" cy="-4" r="2.5" fill="#FFD6B0" />
      </>
    ),
  },

  // ── Aura · behind the tree ────────────────────────────────────────────
  {
    id: "sunbeams",
    name: "Sunbeams",
    krName: "햇살",
    slot: "aura",
    price: 45,
    rarity: "common",
    icon: "🌞",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <g className="aura-spin" opacity=".55">
            {SUNBEAM_RAYS.map((d, i) => (
              <path key={i} d={d} fill="#FFE9A8" />
            ))}
          </g>
          <circle cx="110" cy="112" r="70" fill="#FFF3C4" opacity=".45" />
        </>
      ),
    },
  },
  {
    id: "firefly-glow",
    name: "Firefly Glow",
    krName: "반딧불",
    slot: "aura",
    price: 95,
    rarity: "rare",
    icon: "🪲",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <circle cx="110" cy="115" r="76" fill="#D9F99D" opacity=".28" />
          <g className="aura-twinkle">
            {[[40, 120], [170, 90], [60, 60], [180, 160], [150, 40]].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="8" fill="#FDE047" opacity=".25" />
                <circle cx={x} cy={y} r="3.5" fill="#FDE047" />
              </g>
            ))}
          </g>
          <g className="aura-twinkle-2">
            {[[90, 30], [190, 120], [30, 170], [130, 20]].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="7" fill="#FDE047" opacity=".25" />
                <circle cx={x} cy={y} r="3" fill="#FDE047" />
              </g>
            ))}
          </g>
        </>
      ),
    },
  },
  {
    id: "petal-drift",
    name: "Petal Drift",
    krName: "꽃잎 바람",
    slot: "aura",
    price: 110,
    rarity: "rare",
    icon: "🌸",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <circle cx="110" cy="112" r="72" fill="#FCE7F3" opacity=".5" />
          <g className="aura-fall">
            {[[60, 10], [140, 0], [190, 30], [20, 40]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill="#F9A8D4" />
            ))}
          </g>
          <g className="aura-fall-2">
            {[[100, -10], [170, -20], [40, -30]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="5" ry="3" fill="#FBCFE8" />
            ))}
          </g>
        </>
      ),
    },
  },
  {
    id: "starlight",
    name: "Starlight",
    krName: "별빛",
    slot: "aura",
    price: 220,
    rarity: "epic",
    minPlayerLevel: 50,
    icon: "🌟",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <circle cx="110" cy="110" r="78" fill="#C7D2FE" opacity=".35" />
          <g className="aura-twinkle">
            {[[50, 50], [170, 60], [30, 130], [190, 130], [110, 14]].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y - 7} l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z`} fill="#FDE68A" />
            ))}
          </g>
          <g className="aura-twinkle-2">
            {[[80, 24], [150, 24], [20, 90], [200, 90]].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y - 5} l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5z`} fill="#FFF7D6" />
            ))}
          </g>
        </>
      ),
    },
  },
  {
    id: "rainbow-arc",
    name: "Rainbow Arc",
    krName: "무지개",
    slot: "aura",
    price: 240,
    rarity: "epic",
    icon: "🌈",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          {["#F87171", "#FBBF24", "#4ADE80", "#60A5FA", "#A78BFA"].map((c, i) => (
            <path key={c} d="M-10 200 A120 120 0 0 1 230 200" fill="none" stroke={c} strokeWidth="7" opacity=".55" transform={`translate(0 ${-i * 7})`} />
          ))}
        </>
      ),
    },
  },
  {
    id: "aurora-veil",
    name: "Aurora Veil",
    krName: "오로라",
    slot: "aura",
    price: 420,
    rarity: "legendary",
    minPlayerLevel: 80,
    availableUntil: "2026-09-07",
    icon: "🌌",
    sky: "linear-gradient(180deg,#1E2A44 0%,#2B3C55 55%,#3A4A3A 100%)",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <path d="M-10 90 Q60 20 120 70 T230 60 L230 -10 L-10 -10Z" fill="#7DD3C0" opacity=".5" />
          <path d="M-10 120 Q70 50 130 95 T230 90 L230 -10 L-10 -10Z" fill="#A78BFA" opacity=".4" />
          <g className="aura-twinkle">
            <circle cx="30" cy="30" r="1.8" fill="#fff" />
            <circle cx="150" cy="18" r="1.4" fill="#fff" />
            <circle cx="200" cy="40" r="1.2" fill="#fff" />
          </g>
        </>
      ),
    },
  },
  {
    id: "golden-halo-ring",
    name: "Golden Halo Ring",
    krName: "황금 고리",
    slot: "aura",
    price: 0,
    rarity: "legendary",
    plusOnly: true,
    icon: "💫",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <circle cx="110" cy="110" r="84" fill="none" stroke="#FDE68A" strokeWidth="10" opacity=".55" />
          <circle cx="110" cy="110" r="84" fill="none" stroke="#F59E0B" strokeWidth="3" opacity=".7" />
          <circle cx="110" cy="110" r="74" fill="#FEF3C7" opacity=".35" />
          <g className="aura-twinkle">
            {[[26, 110], [194, 110], [110, 26]].map(([x, y], i) => (
              <path key={i} d={`M${x} ${y - 6} l1.8 4.2 l4.2 1.8 l-4.2 1.8 l-1.8 4.2 l-1.8 -4.2 l-4.2 -1.8 l4.2 -1.8z`} fill="#FDE68A" />
            ))}
          </g>
        </>
      ),
    },
  },

  // ── Sky · frame background ────────────────────────────────────────────
  {
    id: "golden-hour",
    name: "Golden Hour",
    krName: "노을",
    slot: "sky",
    price: 50,
    rarity: "common",
    icon: "🌇",
    sky: "linear-gradient(180deg,#FDBA74 0%,#FDE68A 45%,#E4F3DA 100%)",
    scene: { layer: "behind", draw: () => <circle cx="182" cy="60" r="16" fill="#FB923C" /> },
  },
  {
    id: "moonlit-night",
    name: "Moonlit Night",
    krName: "달밤",
    slot: "sky",
    price: 90,
    rarity: "rare",
    icon: "🌙",
    sky: "linear-gradient(180deg,#1E2A44 0%,#2B3C55 60%,#2A3B2A 100%)",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <circle cx="176" cy="40" r="16" fill="#FDE68A" />
          <circle cx="168" cy="34" r="14" fill="#2B3C55" />
          <g className="aura-twinkle">
            <circle cx="40" cy="30" r="1.8" fill="#fff" />
            <circle cx="90" cy="18" r="1.3" fill="#fff" />
            <circle cx="130" cy="50" r="1.5" fill="#fff" />
          </g>
        </>
      ),
    },
  },
  {
    id: "first-snow",
    name: "First Snow",
    krName: "첫눈",
    slot: "sky",
    price: 100,
    rarity: "rare",
    availableFrom: "2026-12-01",
    availableUntil: "2027-02-28",
    icon: "❄️",
    sky: "linear-gradient(180deg,#DCE7F5 0%,#EEF3F8 60%,#F4F7F4 100%)",
    scene: {
      layer: "front",
      draw: () => (
        <>
          <g className="aura-fall">
            {[[30, 0], [90, -10], [150, 5], [200, -20]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill="#fff" />
            ))}
          </g>
          <g className="aura-fall-2">
            {[[60, -30], [120, -5], [180, -40]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" />
            ))}
          </g>
          <ellipse cx="110" cy="212" rx="84" ry="9" fill="#fff" opacity=".9" />
        </>
      ),
    },
  },
  {
    id: "monsoon-rain",
    name: "Monsoon Rain",
    krName: "장마",
    slot: "sky",
    price: 85,
    rarity: "rare",
    icon: "🌧",
    sky: "linear-gradient(180deg,#94A3B8 0%,#CBD5E1 55%,#D9E4D3 100%)",
    scene: {
      layer: "front",
      draw: () => (
        <>
          <g fill="#F1F5F9" opacity=".9">
            <ellipse cx="60" cy="30" rx="26" ry="9" />
            <ellipse cx="80" cy="24" rx="18" ry="8" />
            <ellipse cx="160" cy="40" rx="22" ry="8" />
          </g>
          <g className="aura-fall" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round">
            {[[30, 0], [70, -10], [120, 5], [170, -15], [200, 10]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x - 2} y2={y + 12} />
            ))}
          </g>
          <g className="aura-fall-2" stroke="#BFDBFE" strokeWidth="2" strokeLinecap="round">
            {[[50, -30], [100, -20], [150, -35], [190, -25]].map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x - 2} y2={y + 10} />
            ))}
          </g>
        </>
      ),
    },
  },
  {
    id: "dawn-mist",
    name: "Dawn Mist",
    krName: "새벽 안개",
    slot: "sky",
    price: 190,
    rarity: "epic",
    icon: "🌫",
    sky: "linear-gradient(180deg,#E9D8FD 0%,#F3E8FF 50%,#E4F3DA 100%)",
    scene: {
      layer: "front",
      draw: () => (
        <g opacity=".7">
          <ellipse cx="60" cy="190" rx="70" ry="10" fill="#fff" />
          <ellipse cx="160" cy="175" rx="60" ry="9" fill="#fff" />
        </g>
      ),
    },
  },
  {
    id: "hanji-sky",
    name: "Hanji Paper Sky",
    krName: "한지 하늘",
    slot: "sky",
    price: 0,
    rarity: "epic",
    plusOnly: true,
    icon: "📜",
    sky: "linear-gradient(180deg,#F7F1E3 0%,#F3EBD8 60%,#E9E3CF 100%)",
    scene: {
      layer: "behind",
      draw: () => (
        <>
          <g stroke="#D8CDB4" strokeWidth="1.2" fill="none" opacity=".8">
            <path d="M-10 40 q40 -8 80 0 t80 0 t80 0" />
            <path d="M-10 70 q40 8 80 0 t80 0 t80 0" />
            <path d="M-10 100 q40 -6 80 0 t80 0 t80 0" />
          </g>
          <circle cx="178" cy="42" r="14" fill="#D9534F" opacity=".85" />
        </>
      ),
    },
  },

  // ── Ground · in front, on the soil ───────────────────────────────────
  {
    id: "wildflowers",
    name: "Wildflowers",
    krName: "들꽃",
    slot: "ground",
    price: 30,
    rarity: "common",
    icon: "🌼",
    scene: {
      layer: "front",
      draw: () => (
        <>
          {[[30, 205, "#F472B6"], [50, 212, "#FACC15"], [170, 206, "#60A5FA"], [190, 213, "#F472B6"], [80, 216, "#FACC15"]].map(([x, y, c], i) => (
            <g key={i}>
              <line x1={x} x2={x} y1={y} y2={Number(y) + 8} stroke="#4E9A6D" strokeWidth="1.6" />
              <circle cx={x} cy={y} r="3.5" fill={String(c)} />
              <circle cx={x} cy={y} r="1.4" fill="#fff" />
            </g>
          ))}
        </>
      ),
    },
  },
  {
    id: "pebble-path",
    name: "Pebble Path",
    krName: "자갈길",
    slot: "ground",
    price: 35,
    rarity: "common",
    icon: "🪨",
    scene: {
      layer: "front",
      draw: () => (
        <>
          {[[40, 214], [62, 220], [88, 224], [132, 224], [158, 220], [180, 214]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="7" ry="3.5" fill="#CBB08A" />
          ))}
        </>
      ),
    },
  },
  {
    id: "mushroom-ring",
    name: "Mushroom Ring",
    krName: "버섯 동그라미",
    slot: "ground",
    price: 80,
    rarity: "rare",
    icon: "🍄",
    scene: {
      layer: "front",
      draw: () => (
        <>
          {[[36, 210], [56, 218], [164, 218], [184, 210]].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 2} y={y} width="4" height="7" fill="#F5E6C8" />
              <ellipse cx={x} cy={y} rx="7" ry="4" fill="#EF4444" />
              <circle cx={x - 2} cy={y - 1} r="1.2" fill="#fff" />
              <circle cx={x + 3} cy={y} r="1" fill="#fff" />
            </g>
          ))}
        </>
      ),
    },
  },
  {
    id: "little-pond",
    name: "Little Pond",
    krName: "작은 연못",
    slot: "ground",
    price: 180,
    rarity: "epic",
    icon: "🐸",
    scene: {
      layer: "front",
      draw: () => (
        <>
          <ellipse cx="166" cy="214" rx="30" ry="9" fill="#93C5FD" />
          <ellipse cx="160" cy="212" rx="8" ry="3" fill="#BFDBFE" />
          <ellipse cx="176" cy="216" rx="5" ry="2.5" fill="#86EFAC" />
          <circle cx="150" cy="208" r="3" fill="#4ADE80" />
          <circle cx="149" cy="207" r=".8" fill="#14532D" />
        </>
      ),
    },
  },
  {
    id: "autumn-leaves",
    name: "Autumn Leaves",
    krName: "낙엽",
    slot: "ground",
    price: 85,
    rarity: "rare",
    availableFrom: "2026-10-01",
    availableUntil: "2026-11-30",
    icon: "🍂",
    scene: {
      layer: "front",
      draw: () => (
        <>
          {[[34, 212, "#D97706", -20], [58, 220, "#DC2626", 15], [90, 224, "#F59E0B", -5], [140, 223, "#DC2626", 30], [168, 219, "#D97706", -25], [188, 211, "#F59E0B", 10]].map(([x, y, c, r], i) => (
            <path key={i} d="M0 -5 C4 -5 6 -1 6 2 C6 5 3 6 0 6 C-3 6 -6 5 -6 2 C-6 -1 -4 -5 0 -5Z M0 -5 L0 6" fill={String(c)} stroke="#7C2D12" strokeWidth=".6" transform={`translate(${x} ${y}) rotate(${r})`} />
          ))}
        </>
      ),
    },
  },
  {
    id: "stone-lantern",
    name: "Stone Lantern",
    krName: "석등",
    slot: "ground",
    price: 0,
    rarity: "epic",
    plusOnly: true,
    icon: "🏮",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(176 206)">
          <rect x="-8" y="0" width="16" height="6" rx="1" fill="#9CA3AF" />
          <rect x="-4" y="-16" width="8" height="16" fill="#B4B8BF" />
          <rect x="-10" y="-20" width="20" height="4" rx="1" fill="#9CA3AF" />
          <rect x="-7" y="-32" width="14" height="12" rx="1" fill="#D1D5DB" />
          <rect x="-3.5" y="-29" width="7" height="6" fill="#FDE68A" className="aura-twinkle" />
          <path d="M-11 -32 L0 -40 L11 -32Z" fill="#9CA3AF" />
        </g>
      ),
    },
  },

  // ── Friend · a companion by the tree ─────────────────────────────────
  {
    id: "sparrow",
    name: "Sparrow",
    krName: "참새",
    slot: "friend",
    price: 40,
    rarity: "common",
    icon: "🐦",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(46 196) scale(1.6)">
          <g className="bob2">
            <ellipse cx="0" cy="0" rx="8" ry="6" fill="#B08A5E" />
            <circle cx="6" cy="-4" r="4.5" fill="#C9A06A" />
            <circle cx="7.5" cy="-5" r="1" fill="#2B2521" />
            <path d="M10 -3 l4 1 l-4 1z" fill="#F5A623" />
            <path d="M-2 6 l-1 4 M2 6 l1 4" stroke="#F5A623" strokeWidth="1.4" />
          </g>
        </g>
      ),
    },
  },
  {
    id: "squirrel",
    name: "Squirrel",
    krName: "다람쥐",
    slot: "friend",
    price: 95,
    rarity: "rare",
    icon: "🐿️",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(168 196) scale(1.6)">
          <path d="M6 2 C14 -14 2 -18 -2 -6" stroke="#B4651E" strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="0" cy="0" rx="8" ry="6" fill="#D97D3B" />
          <circle cx="-6" cy="-4" r="4.5" fill="#E08A4A" />
          <circle cx="-7.5" cy="-5" r="1" fill="#2B2521" />
          <path d="M-9 -8 l-1 -3 l3 1z" fill="#E08A4A" />
          <circle cx="-4" cy="1" r="2" fill="#F5E6C8" />
        </g>
      ),
    },
  },
  {
    id: "garden-cat",
    name: "Garden Cat",
    krName: "고양이",
    slot: "friend",
    price: 120,
    rarity: "rare",
    icon: "🐈",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(40 194) scale(1.6)">
          <ellipse cx="0" cy="2" rx="10" ry="6" fill="#4B5563" />
          <circle cx="8" cy="-4" r="5.5" fill="#4B5563" />
          <path d="M4 -8 l1 -4 l3 3z M10 -9 l2 -3 l1 4z" fill="#4B5563" />
          <circle cx="7" cy="-4" r="1" fill="#A7F3D0" />
          <circle cx="10.5" cy="-4" r="1" fill="#A7F3D0" />
          <path d="M-9 0 C-16 -4 -16 4 -10 6" stroke="#4B5563" strokeWidth="3" fill="none" strokeLinecap="round" className="sway-slow" />
        </g>
      ),
    },
  },
  {
    id: "magpie",
    name: "Magpie",
    krName: "까치",
    slot: "friend",
    price: 200,
    rarity: "epic",
    minPlayerLevel: 30,
    icon: "🐧",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(180 190) scale(1.6)">
          <g className="friend-float">
            <path d="M-12 4 L-2 0" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="4" cy="0" rx="9" ry="5.5" fill="#1F2937" />
            <ellipse cx="6" cy="1" rx="5" ry="3" fill="#fff" />
            <circle cx="12" cy="-4" r="4.5" fill="#1F2937" />
            <circle cx="13.5" cy="-5" r="1" fill="#fff" />
            <path d="M16 -3 l5 1 l-5 1z" fill="#374151" />
            <path d="M0 -3 q5 -4 9 -1" stroke="#60A5FA" strokeWidth="1.6" fill="none" />
          </g>
        </g>
      ),
    },
  },
  {
    id: "baby-owl",
    name: "Baby Owl",
    krName: "아기 부엉이",
    slot: "friend",
    price: 230,
    rarity: "epic",
    minPlayerLevel: 60,
    icon: "🦉",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(40 188) scale(1.6)">
          <g className="friend-float-2">
            <ellipse cx="0" cy="2" rx="9" ry="10" fill="#A16207" />
            <ellipse cx="0" cy="4" rx="6" ry="6" fill="#FDE68A" />
            <circle cx="-3.5" cy="-2" r="3.5" fill="#fff" />
            <circle cx="3.5" cy="-2" r="3.5" fill="#fff" />
            <circle cx="-3.5" cy="-2" r="1.6" fill="#1F2937" />
            <circle cx="3.5" cy="-2" r="1.6" fill="#1F2937" />
            <path d="M-1.5 1 l1.5 2.5 l1.5 -2.5z" fill="#F59E0B" />
            <path d="M-8 -9 l3 4 M8 -9 l-3 4" stroke="#A16207" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </g>
      ),
    },
  },
  {
    id: "dokkaebi",
    name: "Dokkaebi Spirit",
    krName: "도깨비",
    slot: "friend",
    price: 0,
    rarity: "legendary",
    plusOnly: true,
    icon: "👹",
    scene: {
      layer: "front",
      draw: () => (
        <g transform="translate(44 186) scale(1.6)">
          <g className="bob">
            <circle cx="0" cy="8" r="9" fill="#60A5FA" opacity=".3" />
            <ellipse cx="0" cy="4" rx="8" ry="9" fill="#3B82F6" />
            <path d="M-4 -4 l-2 -7 l5 3z M4 -4 l2 -7 l-5 3z" fill="#FDE68A" />
            <circle cx="-3" cy="2" r="1.6" fill="#fff" />
            <circle cx="3" cy="2" r="1.6" fill="#fff" />
            <circle cx="-3" cy="2" r=".8" fill="#1E3A8A" />
            <circle cx="3" cy="2" r=".8" fill="#1E3A8A" />
            <path d="M-3 7 q3 3 6 0" stroke="#1E3A8A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M8 2 l6 -6" stroke="#92400E" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="14" cy="-4" r="2.5" fill="#B45309" />
          </g>
        </g>
      ),
    },
  },
  {
    id: "dragon",
    name: "Guardian Dragon",
    krName: "용",
    slot: "friend",
    price: 520,
    rarity: "legendary",
    minPlayerLevel: 100,
    icon: "\ud83d\udc09",
    scene: {
      layer: "front",
      draw: () => {
        // Tail-to-neck beads, each a little smaller than the last, tracing
        // a rearing S-curve. The head is drawn separately, bigger, on top.
        const body: { x: number; y: number; r: number }[] = [
          { x: 6, y: 8, r: 5 },
          { x: 1, y: -6, r: 6.5 },
          { x: -6, y: -19, r: 8 },
          { x: -3, y: -33, r: 10 },
          { x: 8, y: -46, r: 11.5 },
          { x: 18, y: -60, r: 10 },
          { x: 21, y: -75, r: 8.5 },
        ];
        return (
          <g transform="translate(170 210)">
            <g className="friend-float">
              {/* clouds at the base — a dragon is never far from them */}
              <g opacity=".8">
                <ellipse cx="-8" cy="10" rx="14" ry="5" fill="#fff" />
                <ellipse cx="7" cy="15" rx="10" ry="4" fill="#fff" />
              </g>
              {body.map((seg, i) => (
                <circle key={i} cx={seg.x} cy={seg.y} r={seg.r} fill={i % 2 ? "#0D9488" : "#14B8A6"} />
              ))}
              {/* back ridge, every other segment */}
              {body
                .filter((_, i) => i % 2 === 0)
                .map((seg, i) => (
                  <path
                    key={i}
                    d={`M${seg.x - 4} ${seg.y - seg.r * 0.5} L${seg.x} ${seg.y - seg.r * 1.5} L${seg.x + 4} ${seg.y - seg.r * 0.5}Z`}
                    fill="#F59E0B"
                  />
                ))}
              {/* golden belly scutes along the chest */}
              {body.slice(0, 5).map((seg, i) => (
                <rect
                  key={i}
                  x={seg.x - 3}
                  y={seg.y + seg.r * 0.3}
                  width="6"
                  height="3"
                  rx="1"
                  fill="#FDE68A"
                  transform={`rotate(${-20 + i * 8} ${seg.x} ${seg.y})`}
                />
              ))}
              {/* head */}
              <circle cx="24" cy="-90" r="13" fill="#0D9488" />
              <path d="M18 -100 Q13 -113 9 -117" stroke="#92400E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d="M29 -101 Q34 -114 39 -117" stroke="#92400E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d="M14 -86 Q4 -84 -3 -78" stroke="#F59E0B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <path d="M15 -82 Q6 -78 1 -70" stroke="#F59E0B" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              <circle cx="19" cy="-92" r="2.1" fill="#1F2937" />
              <circle cx="19.7" cy="-92.7" r=".7" fill="#fff" />
              <circle cx="29" cy="-92" r="2.1" fill="#1F2937" />
              <circle cx="29.7" cy="-92.7" r=".7" fill="#fff" />
              <path d="M20 -85 Q24 -82 28 -85" stroke="#134E4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              {/* 여의주 — the wish-granting pearl */}
              <circle cx="41" cy="-88" r="5.5" fill="#FDE68A" />
              <circle cx="39" cy="-90" r="2" fill="#fff" opacity=".85" />
              <path d="M41 -98 l1.6 4 l4 1.6 l-4 1.6 l-1.6 4 l-1.6 -4 l-4 -1.6 l4 -1.6z" fill="#FFD66B" opacity=".9" />
            </g>
          </g>
        );
      },
    },
  },
];

export function costumeById(id: string) {
  return COSTUMES.find((c) => c.id === id);
}

// Where each slot sits on the level creature (TreeCard's 220x230 viewBox).
// The creature's head moves and grows with the level, so anchors do too.
export type WearableSlot = "hat" | "face" | "neck";
export const COSTUME_ANCHORS: Record<CefrLevel, Record<WearableSlot, { x: number; y: number; s: number }>> = {
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
        if (!costume?.render) return null;
        const a = COSTUME_ANCHORS[level][costume.slot as WearableSlot];
        return (
          <g key={id} transform={`translate(${a.x} ${a.y}) scale(${a.s})`}>
            {costume.render()}
          </g>
        );
      })}
    </>
  );
}

/** Garden items (auras, sky details, ground, friends) drawn straight into the
 *  220x230 tree frame. Render the `behind` layer before the creature and
 *  `front` after it. `groundShift` pushes ground-slot items down when the
 *  frame is taller than 230 (VeteranTree). */
export function SceneLayer({
  costumeIds,
  layer,
  groundShift = 0,
}: {
  costumeIds: string[];
  layer: "behind" | "front";
  groundShift?: number;
}) {
  return (
    <>
      {costumeIds.map((id) => {
        const c = costumeById(id);
        if (!c?.scene || c.scene.layer !== layer) return null;
        const dy = c.slot === "ground" || c.slot === "friend" ? groundShift : 0;
        return (
          <g key={id} transform={dy ? `translate(0 ${dy})` : undefined}>
            {c.scene.draw()}
          </g>
        );
      })}
    </>
  );
}

/** The frame background for these costumes: a sky item's gradient, else null. */
export function skyFor(costumeIds: string[]): string | null {
  for (const id of costumeIds) {
    const c = costumeById(id);
    if (c?.sky) return c.sky;
  }
  return null;
}

/** On sale right now? (Limited-time windows are inclusive, UTC dates.) */
export function isAvailable(c: Costume, now: Date = new Date()): boolean {
  const day = now.toISOString().slice(0, 10);
  if (c.availableFrom && day < c.availableFrom) return false;
  if (c.availableUntil && day > c.availableUntil) return false;
  return true;
}

export function isLevelLocked(c: Costume, playerLevel: number): boolean {
  return !!c.minPlayerLevel && playerLevel < c.minPlayerLevel;
}
