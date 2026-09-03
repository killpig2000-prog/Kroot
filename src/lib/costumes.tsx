import type { ReactNode } from "react";
import type { CefrLevel } from "@/lib/tree";
import { AdmiralSkin, KingSkin, ScholarSkin } from "@/lib/costume-skins";


// Wearables sit on the tree at a per-stage anchor; garden slots dress the
// scene around it (aura/sky behind the tree, ground/friend in front).
// `ribbon` is the weekly fair's prize (see RIBBONS below): a scene item
// pinned to a fixed frame position rather than a per-level anchor, and
// never sold, so it's in neither list below and gets no shop tab.
// `skin` is an event costume that replaces the whole tree while worn: the
// growing tree is hidden (not lost) and comes back at its real stage when the
// skin is taken off. Wearables are skipped while a skin is on; garden items
// still dress the scene around it.
export type CostumeSlot = "hat" | "face" | "neck" | "ribbon" | "aura" | "sky" | "ground" | "friend" | "skin";
export const WEARABLE_SLOTS: CostumeSlot[] = ["hat", "face", "neck"];
export const GARDEN_SLOTS: CostumeSlot[] = ["aura", "sky", "ground", "friend"];
export const SKIN_SLOTS: CostumeSlot[] = ["skin"];
export const SLOT_LABELS: Record<CostumeSlot, { en: string; icon: string }> = {
  hat: { en: "Hats", icon: "🎩" },
  face: { en: "Face", icon: "👓" },
  neck: { en: "Neck", icon: "🧣" },
  ribbon: { en: "Ribbon", icon: "🎀" },
  aura: { en: "Aura", icon: "✨" },
  sky: { en: "Sky", icon: "🌤" },
  ground: { en: "Ground", icon: "🌼" },
  friend: { en: "Friend", icon: "🐦" },
  skin: { en: "Skins", icon: "🎭" },
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
  // Skins: the full-body character drawn into the 220x230 frame *instead of*
  // the tree (LevelCreature returns this when a skin is equipped).
  creature?: () => ReactNode;
};

// Precomputed so server and client render byte-identical path strings.
const SUNBEAM_RAYS: string[] = Array.from({ length: 12 }, (_, i) => {
  const a = (i * Math.PI) / 6;
  const f = (n: number) => n.toFixed(1);
  return `M110 120 L${f(110 + Math.cos(a) * 160)} ${f(120 + Math.sin(a) * 160)} L${f(110 + Math.cos(a + 0.18) * 160)} ${f(120 + Math.sin(a + 0.18) * 160)}Z`;
});

// Shared gradients/pattern/filters for the "spirit" companions (dragon, deer,
// dokkaebi). objectBoundingBox gradients (the default) so each shape gets its
// own light-to-dark ramp regardless of where it's positioned or scaled — a
// userSpaceOnUse gradient would go flat or misaligned in a shop thumbnail.
function SpiritDefs() {
  return (
    <defs>
      <linearGradient id="sp-body" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A5F3FC" />
        <stop offset="55%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#4C1D95" />
      </linearGradient>
      <linearGradient id="sp-fin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E0F2FE" stopOpacity=".9" />
        <stop offset="100%" stopColor="#67E8F9" stopOpacity=".25" />
      </linearGradient>
      <linearGradient id="sp-horn" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="100%" stopColor="#ECFEFF" />
      </linearGradient>
      <linearGradient id="sp-deer" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#C7D2FE" />
      </linearGradient>
      <radialGradient id="sp-hoof" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#A5F3FC" stopOpacity=".8" />
        <stop offset="100%" stopColor="#A5F3FC" stopOpacity="0" />
      </radialGradient>
      <pattern id="sp-scale" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
        <path
          d="M0 7 a3.5 3.5 0 0 1 7 0 M-3.5 3.5 a3.5 3.5 0 0 1 7 0 M3.5 3.5 a3.5 3.5 0 0 1 7 0"
          fill="none"
          stroke="#fff"
          strokeWidth=".9"
          opacity=".35"
        />
      </pattern>
      <filter id="sp-glow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="sp-glow-soft" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  );
}
const SP = { indigo: "#312E81", cyan: "#67E8F9", ice: "#CFFAFE", gold: "#FDE68A", star: "#FDE68A" };

// ── Baby Spirit Dragon: big head, tiny body, two small fluttering wings ──
function DragonWing({ x, y, s, cls }: { x: number; y: number; s: number; cls: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={cls}>
      <path
        d="M0 0 C-10 -4 -18 -2 -22 6 C-16 4 -10 5 -6 9 C-12 10 -17 14 -18 20 C-11 16 -5 15 0 17 C-3 20 -4 25 -2 29 C2 24 6 20 9 15 C10 10 8 4 0 0Z"
        fill="url(#sp-fin)"
      />
      <path
        d="M0 0 C-10 -4 -18 -2 -22 6 M-6 9 C-12 10 -17 14 -18 20 M0 17 C-3 20 -4 25 -2 29"
        stroke="#fff"
        strokeWidth="1.1"
        opacity=".55"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function BabyDragon() {
  return (
    <g>
      <ellipse cx="0" cy="27" rx="19" ry="5" fill={SP.cyan} opacity=".18" />
      <g className="sp-hop">
        <g filter="url(#sp-glow-soft)" opacity=".4">
          <ellipse cx="0" cy="0" rx="22" ry="22" fill={SP.cyan} />
        </g>
        {/* tail, curls out front */}
        <path d="M12 18 C24 20 30 12 26 4 C24 10 20 14 14 15Z" fill="url(#sp-body)" />
        <path d="M23 8 l4 -2 l1 4.5 l-4 1.5z" fill="url(#sp-fin)" />
        <DragonWing x={-10} y={-6} s={0.85} cls="sp-wisp" />
        {/* body */}
        <ellipse cx="0" cy="10" rx="14" ry="12" fill="url(#sp-body)" />
        <ellipse cx="0" cy="12" rx="9" ry="8" fill="#E0F2FE" opacity=".9" />
        <path
          d="M0 6 q2 2 0 4 M-4 8 q2 1.6 0 3.2 M4 8 q2 1.6 0 3.2"
          stroke={SP.cyan}
          strokeWidth="1"
          opacity=".7"
          fill="none"
          strokeLinecap="round"
        />
        {/* back spikes */}
        <path
          d="M-3 -1 l-3 -5 l4 2 M3 -3 l-1 -6 l4 3 M8 -1 l2 -5 l3 4"
          stroke="url(#sp-horn)"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* arms */}
        <path d="M-13 6 C-19 4 -22 8 -20 13 C-17 10 -14 9 -11 10Z" fill="url(#sp-body)" />
        <path d="M13 6 C19 4 22 9 19 13 C16 10 14 9 12 9Z" fill="url(#sp-body)" />
        {/* legs */}
        <ellipse cx="-8" cy="21" rx="5.5" ry="4" fill="url(#sp-body)" />
        <ellipse cx="8" cy="21" rx="5.5" ry="4" fill="url(#sp-body)" />
        <path
          d="M-11 23 l-2 2 M-8 24 l0 2.4 M-5 23 l2 2 M5 23 l-2 2 M8 24 l0 2.4 M11 23 l2 2"
          stroke={SP.gold}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
        {/* head */}
        <circle cx="0" cy="-11" r="15" fill="url(#sp-body)" />
        <path d="M-9 -20 q9 -6 20 -3" stroke="#fff" strokeWidth="2.4" opacity=".4" strokeLinecap="round" fill="none" />
        {/* snout */}
        <ellipse cx="1" cy="-3" rx="8" ry="5.5" fill="#E0F2FE" opacity=".95" />
        <path d="M-2 -1 q3 2.4 6 0" stroke={SP.indigo} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <circle cx="-3" cy="-4" r=".8" fill={SP.indigo} opacity=".8" />
        <circle cx="5" cy="-4" r=".8" fill={SP.indigo} opacity=".8" />
        {/* horn nubs */}
        <path d="M-6 -23 q-2 -5 -6 -6 q2 4 3 8Z M5 -24 q1 -5 5 -7 q-2 4 -2 8Z" fill="url(#sp-horn)" />
        {/* ears/frills */}
        <path d="M-13 -14 C-19 -13 -20 -6 -15 -3 C-15 -8 -14 -12 -11 -14Z" fill="url(#sp-fin)" opacity=".9" />
        <path d="M12 -15 C18 -14 19 -7 14 -4 C14 -9 13 -13 10 -15Z" fill="url(#sp-fin)" opacity=".9" />
        {/* eyes */}
        <g className="blink">
          <ellipse cx="-6.5" cy="-12" rx="4.6" ry="5.2" fill="#fff" />
          <ellipse cx="6.5" cy="-12" rx="4.6" ry="5.2" fill="#fff" />
          <circle cx="-5.8" cy="-11.4" r="2.7" fill={SP.indigo} />
          <circle cx="7.2" cy="-11.4" r="2.7" fill={SP.indigo} />
          <circle cx="-4.8" cy="-12.6" r=".9" fill="#fff" />
          <circle cx="8.2" cy="-12.6" r=".9" fill="#fff" />
        </g>
        <circle cx="-10" cy="-6" r="2.6" fill="#F9A8D4" opacity=".5" />
        <circle cx="10" cy="-6" r="2.6" fill="#F9A8D4" opacity=".5" />
        {/* little fire puff */}
        <g className="sp-flick">
          <path d="M8 -1 q6 -2 9 3 q-4 2 -9 0z" fill="#F97316" opacity=".9" />
          <path d="M9 -1 q3.4 -1 5 1.4 q-2.4 1 -5 0z" fill="#FDE68A" />
        </g>
        <DragonWing x={9} y={-4} s={1} cls="sp-wisp2" />
      </g>
    </g>
  );
}

// ── Spirit Dokkaebi: glowing goblin friend with a lumpy club and dokkaebi-fire ──
function DokkaebiFire({ x, y, s, cls }: { x: number; y: number; s: number; cls: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className={cls}>
      <g filter="url(#sp-glow)">
        <path
          d="M0 6 C-6 2 -7 -6 -2 -12 C-3 -7 -1 -4 2 -3 C1 -7 3 -11 8 -13 C6 -8 8 -4 11 -2 C9 2 6 6 0 6Z"
          fill="url(#sp-fin)"
        />
      </g>
      <path d="M0 4 C-3 1 -4 -4 -1 -8" stroke="#fff" strokeWidth="1" opacity=".6" fill="none" />
    </g>
  );
}

function SpiritDokkaebi() {
  return (
    <g>
      <ellipse cx="0" cy="24" rx="20" ry="5" fill={SP.cyan} opacity=".18" />
      <DokkaebiFire x={-24} y={-30} s={1.1} cls="sp-rise" />
      <DokkaebiFire x={24} y={-24} s={1} cls="sp-rise2" />
      <g className="sp-hop">
        <g filter="url(#sp-glow-soft)" opacity=".45">
          <ellipse cx="0" cy="-6" rx="19" ry="21" fill={SP.cyan} />
        </g>
        <path d="M-10 8 C-14 16 -12 22 -6 22 C-7 17 -8 12 -7 8Z" fill="url(#sp-body)" />
        <path d="M9 6 C15 12 15 20 9 22 C9 17 8 12 7 8Z" fill="url(#sp-body)" />
        <ellipse cx="0" cy="-2" rx="15" ry="17" fill="url(#sp-body)" />
        <ellipse cx="0" cy="-2" rx="15" ry="17" fill="url(#sp-scale)" />
        <path d="M-9 -14 q9 -8 18 -2" stroke="#fff" strokeWidth="2.4" opacity=".4" strokeLinecap="round" fill="none" />
        <path d="M-11 6 C-15 4 -15 12 -10 14 C-13 16 -17 13 -16 8 C-15 4 -13 3 -11 6Z" fill="#F59E0B" opacity=".9" />
        <path d="M11 8 C15 6 16 13 11 15 C14 17 18 13 17 9 C16 5 13 5 11 8Z" fill="#F59E0B" opacity=".9" />
        <path d="M-2 -20 l1.6 -8 l3.6 6.5z" fill={SP.gold} filter="url(#sp-glow)" />
        <path d="M6 -21 l2.4 -7 l3 6.8z" fill={SP.gold} filter="url(#sp-glow)" />
        <path
          d="M-9 -18 q-2 -5 1 -8 M-2 -21 q0 -5 3 -7"
          stroke={SP.ice}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity=".8"
        />
        <g className="blink">
          <ellipse cx="-5" cy="-6" rx="3.6" ry="4.2" fill="#fff" />
          <ellipse cx="6" cy="-6" rx="3.6" ry="4.2" fill="#fff" />
          <circle cx="-4.4" cy="-5.4" r="2" fill={SP.indigo} />
          <circle cx="6.6" cy="-5.4" r="2" fill={SP.indigo} />
          <circle cx="-3.8" cy="-6.2" r=".6" fill="#fff" />
          <circle cx="7.2" cy="-6.2" r=".6" fill="#fff" />
        </g>
        <path d="M-6 1 q6 6 12 0" stroke={SP.indigo} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path
          d="M-6 1.5 l-2 3 M-3 3 l-1.5 3.4 M0 3.4 l0 3.6 M3 3 l1.5 3.4 M6 1.5 l2 3"
          stroke="#fff"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity=".9"
        />
        <path d="M-16 8 l-9 8" stroke="url(#sp-body)" strokeWidth="4" strokeLinecap="round" />
        <g transform="translate(-27 14) rotate(-30)">
          <path d="M-3 -14 h6 v18 h-6z" fill="#B45309" />
          <circle cx="0" cy="-16" r="5" fill="#92400E" />
          <circle cx="-3" cy="-18" r="1.6" fill="#D97706" />
          <circle cx="3" cy="-14" r="1.6" fill="#D97706" />
          <circle cx="1" cy="-19" r="1.4" fill="#D97706" />
        </g>
        <path
          d="M-5 15 C-8 19 -7 23 -3 23 C-4 20 -4 17 -3 15Z M5 15 C8 19 7 23 3 23 C4 20 4 17 3 15Z"
          fill="#F59E0B"
        />
        <g stroke={SP.ice} strokeWidth="1.3" opacity=".7">
          <path d="M-4 16 l1.5 4 M0 17 l0 4.5 M4 16 l-1.5 4" />
        </g>
      </g>
    </g>
  );
}

// ── Forest Spirit Deer: glowing white deer with a spotted back and antlers ──
const DEER_SPOTS: [number, number][] = [
  [-11, -6], [-3, -9], [6, -7], [-7, -1], [2, -3], [10, -2], [-13, 3], [8, 4], [-1, 7],
];
const DEER_ANTLER_STARS: [number, number][] = [
  [-9, -21], [12, -21], [-12, -25], [16, -25], [-8, -29], [12, -30],
];
const DEER_HOOVES: [number, number][] = [[-15, 22], [-8, 24], [10, 22], [17, 20]];

function DeerAntler({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s} 1)`}>
      <g filter="url(#sp-glow)" className="sp-antler">
        <path
          d="M0 0 C-1 -9 -4 -16 -9 -21 M0 -6 C3 -13 7 -18 12 -21 M-2 -12 C-7 -14 -11 -18 -12 -25 M2 -11 C4 -18 10 -23 16 -25 M-5 -17 C-8 -21 -9 -25 -8 -29 M7 -17 C10 -22 12 -26 12 -30"
          stroke="url(#sp-horn)"
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      {DEER_ANTLER_STARS.map(([px, py], i) => (
        <g key={i}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 1.5;0 0"
            dur={`${(2.4 + i * 0.3).toFixed(1)}s`}
            repeatCount="indefinite"
          />
          <path
            d={`M${px} ${py - 3} l1.1 2.4 l2.4 1.1 l-2.4 1.1 l-1.1 2.4 l-1.1 -2.4 l-2.4 -1.1 l2.4 -1.1z`}
            fill={SP.star}
          />
          <circle cx={px} cy={py} r="4" fill={SP.star} opacity=".18" />
        </g>
      ))}
    </g>
  );
}

function SpiritDeer() {
  return (
    <g>
      <ellipse cx="0" cy="26" rx="26" ry="6" fill={SP.cyan} opacity=".18" />
      {DEER_HOOVES.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y + 3} rx="6" ry="2.4" fill="url(#sp-hoof)" />
      ))}
      <g className="sp-breath">
        <g filter="url(#sp-glow-soft)" opacity=".5">
          <ellipse cx="4" cy="-8" rx="26" ry="18" fill={SP.ice} />
        </g>
        <g className="sp-tailflick">
          <path d="M-20 -2 C-27 -5 -30 3 -22 5" fill="#fff" />
          <path d="M-22 -1 C-28 -3 -29 2 -23 3" stroke={SP.cyan} strokeWidth="1" fill="none" opacity=".7" />
        </g>
        <path d="M-14 6 l-2 16 M-8 8 l-1 16" stroke="url(#sp-deer)" strokeWidth="3.6" strokeLinecap="round" />
        <path d="M-16 22 h3 M-9 24 h3" stroke={SP.cyan} strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="0" cy="0" rx="21" ry="12" fill="url(#sp-deer)" />
        <path d="M-14 -8 q10 -6 24 -3" stroke="#fff" strokeWidth="2.6" opacity=".9" strokeLinecap="round" fill="none" />
        <ellipse cx="2" cy="5" rx="15" ry="6" fill="#fff" opacity=".85" />
        {DEER_SPOTS.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="1.7" fill={SP.cyan} className="sp-glowp" style={{ animationDelay: `${(i * 0.35).toFixed(2)}s` }} />
            <circle cx={x} cy={y} r="3.4" fill={SP.cyan} opacity=".18" />
          </g>
        ))}
        <path d="M10 6 l1 16 M16 4 l2 16" stroke="url(#sp-deer)" strokeWidth="3.8" strokeLinecap="round" />
        <path d="M9 22 h3.5 M16 20 h3.5" stroke={SP.cyan} strokeWidth="2.4" strokeLinecap="round" />
        <path
          d="M12 -2 q3 2 5 6 M14 -6 q3 2 5 6"
          stroke="#fff"
          strokeWidth="1.4"
          opacity=".6"
          strokeLinecap="round"
          fill="none"
        />
        {/* neck + head, pivoting from the chest joint to graze every 8s */}
        <g transform="translate(14 -4)">
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0;0;36;36;0;0"
              keyTimes="0;.5;.62;.82;.92;1"
              dur="8s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines=".4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1;.4 0 .2 1"
            />
            <path d="M0 0 C6 -8 10 -18 16 -26" stroke="url(#sp-deer)" strokeWidth="11" strokeLinecap="round" fill="none" />
            <path d="M-1 -1 C5 -9 9 -19 15 -27" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".6" />
            <ellipse cx="19" cy="-30" rx="10" ry="8.5" fill="url(#sp-deer)" />
            <path d="M22 -28 C30 -28 32 -23 30 -20 C28 -17 22 -18 20 -20Z" fill="#EEF2FF" />
            <ellipse cx="27" cy="-21" rx="2.6" ry="1.9" fill="#fff" />
            <circle cx="31" cy="-21" r="1.7" fill={SP.indigo} />
            <path d="M13 -36 q4 -5 8 -3" stroke="#fff" strokeWidth="2" opacity=".9" strokeLinecap="round" fill="none" />
            <g className="sp-ear">
              <path d="M12 -36 C8 -44 10 -48 16 -44 C17 -40 16 -37 14 -35Z" fill="#EEF2FF" />
              <path d="M13 -37 C11 -42 12 -44 15 -42 C15.5 -40 15 -38 14 -37Z" fill={SP.ice} />
            </g>
            <path d="M22 -37 C24 -45 28 -47 30 -42 C29 -39 26 -37 24 -36Z" fill="#EEF2FF" />
            <path d="M23.5 -38 C25 -43 27 -44 28 -41 C27.5 -39.5 26 -38.5 25 -38Z" fill={SP.ice} />
            <DeerAntler x={15} y={-38} s={1} />
            <path
              d="M19 -31 q3 2.6 6 0"
              stroke={SP.indigo}
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M19.5 -30.6 l-1 1.4 M22 -29.6 l0 1.6 M24.5 -30.6 l1 1.4"
              stroke={SP.indigo}
              strokeWidth=".9"
              strokeLinecap="round"
            />
            <circle cx="16" cy="-27" r="2.2" fill={SP.cyan} opacity=".35" />
            <path
              d="M4 -3 q-2 3 -1 6 M8 -9 q-2 3 -1 6"
              stroke="#fff"
              strokeWidth="1.6"
              opacity=".7"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
      </g>
    </g>
  );
}

// ── Ribbon · the weekly fair's prize ─────────────────────────────────────
// County-fair medals for last week's top 3 in your bed. Not for sale:
// settle_league_weeks() (migration 0059) pins one into user_costumes each
// Monday and takes last week's off, so a medal is worn for exactly one
// week. Drawn as a `front` scene item pinned to a fixed spot in the
// 220x230 frame's top-right corner — same (x, y) at every CEFR stage and
// every VeteranTree height, since those frames only grow *downward* past
// level 50. Each place gets its own silhouette, not just a color, so 1st
// vs. 2nd vs. 3rd reads at a glance: 1st is the only one with laurel
// sprigs, 3rd drops the pleats and tails for a plain pendant disc.
const RIBBON_X = 188;
const RIBBON_Y = 30;
function FairMedal({ bg, fg, ring, place }: { bg: string; fg: string; ring: string; place: 1 | 2 | 3 }) {
  return (
    <g transform={`translate(${RIBBON_X} ${RIBBON_Y})`}>
      {place === 1 && (
        <g fill="#4C7A3F" stroke="#3A5F30" strokeWidth=".6">
          <path d="M-8 -16 Q2 -22 -2 -32 Q-10 -26 -12 -18Z" />
          <path d="M0 -6 Q12 -9 10 -20 Q0 -16 -4 -8Z" />
          <path d="M2 6 Q15 6 16 -6 Q4 -4 -2 4Z" />
          <path d="M-8 16 Q4 20 8 9 Q-3 8 -10 12Z" />
        </g>
      )}
      {place <= 2 ? (
        <g transform={`scale(${place === 1 ? 1.35 : 1.2})`}>
          <circle r="19" fill={bg} />
          <g stroke={ring} strokeWidth="1.2" opacity=".55">
            <line x1="0" y1="-19" x2="0" y2="19" />
            <line x1="-16.5" y1="-9.5" x2="16.5" y2="9.5" />
            <line x1="-16.5" y1="9.5" x2="16.5" y2="-9.5" />
            <line x1="-19" y1="0" x2="19" y2="0" />
          </g>
          <circle r="12" fill={ring} />
          <circle cx="-4" cy="-5" r="3.2" fill="#FFFFFF" opacity=".85" />
          <text y="6" textAnchor="middle" fontFamily="Georgia, 'Noto Serif KR', serif" fontSize="14" fontWeight="700" fill={fg}>
            {place}
          </text>
          <path d="M-9 15 L-15 41 L-3 33 Z" fill={bg} stroke={ring} strokeWidth="1" />
          <path d="M9 15 L15 41 L3 33 Z" fill={bg} stroke={ring} strokeWidth="1" />
        </g>
      ) : (
        <g transform="scale(1.1)">
          <path d="M-6 -20 L6 -20 L4 -4 L-4 -4 Z" fill={bg} stroke={ring} strokeWidth="1" />
          <circle r="15" fill={bg} stroke={ring} strokeWidth="1.2" />
          <circle r="15" fill="none" stroke={ring === "#8F5C36" ? "#F0DAC5" : "#FFF"} strokeWidth="1" strokeDasharray="2 2.4" opacity=".7" />
          <text y="6" textAnchor="middle" fontFamily="Georgia, 'Noto Serif KR', serif" fontSize="16" fontWeight="700" fill={fg}>
            {place}
          </text>
        </g>
      )}
    </g>
  );
}

export const RIBBONS = [
  { id: "ribbon-blue", place: 1, bg: "#D9A93A", ring: "#B8862A", fg: "#5C4A0E", color: "blue" },
  { id: "ribbon-red", place: 2, bg: "#AEB9C4", ring: "#8B96A1", fg: "#3A4048", color: "red" },
  { id: "ribbon-yellow", place: 3, bg: "#B4784A", ring: "#8F5C36", fg: "#F0DAC5", color: "yellow" },
] as const;
export type RibbonColor = (typeof RIBBONS)[number]["color"];

const RIBBON_COSTUMES: Costume[] = RIBBONS.map((r) => ({
  id: r.id,
  name: `${r.color[0].toUpperCase()}${r.color.slice(1)} Ribbon`,
  krName: r.color === "blue" ? "1등 메달" : r.color === "red" ? "2등 메달" : "3등 메달",
  slot: "ribbon",
  price: 0,
  rarity: "rare",
  icon: "🎀",
  scene: { layer: "front", draw: () => <FairMedal bg={r.bg} ring={r.ring} fg={r.fg} place={r.place} /> },
}));

export const COSTUMES: Costume[] = [
  // The welcome gift: free, first in Hats, and what the guided tour has a
  // brand-new learner claim so the shop's buy-and-wear loop has been done
  // once for real. Stays in the catalog for anyone who skipped the tour.
  {
    id: "welcome-bow",
    name: "Welcome Bow",
    krName: "선물 리본",
    slot: "hat",
    price: 0,
    rarity: "common",
    render: () => (
      <>
        <path d="M-3 0 C-13 -13 -27 -7 -18 3 C-27 12 -13 17 -3 3 Z" fill="#F0668A" />
        <path d="M3 0 C13 -13 27 -7 18 3 C27 12 13 17 3 3 Z" fill="#F0668A" />
        <path d="M-9 6 L-14 18 L-6 14 Z" fill="#E04F73" />
        <path d="M9 6 L14 18 L6 14 Z" fill="#E04F73" />
        <circle cx="0" cy="2" r="5" fill="#C93A5E" />
      </>
    ),
  },
  {
    id: "straw-hat",
    name: "Straw Hat",
    krName: "밀짚모자",
    slot: "hat",
    price: 82,
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
    price: 78,
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
    price: 720,
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
    price: 72,
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
    price: 76,
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
    price: 290,
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
    price: 84,
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
    price: 320,
    rarity: "rare",
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
    price: 310,
    rarity: "rare",
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
    price: 330,
    rarity: "rare",
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
    price: 760,
    rarity: "epic",
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
    price: 740,
    rarity: "epic",
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
    price: 300,
    rarity: "rare",
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
    price: 88,
    rarity: "common",
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
    price: 730,
    rarity: "epic",
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
    price: 315,
    rarity: "rare",
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
    price: 68,
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
    price: 295,
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
    price: 145,
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
    price: 390,
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
    price: 420,
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
    price: 820,
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
    price: 800,
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
    price: 1020,
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
    price: 980,
    rarity: "legendary",
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
    price: 160,
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
    price: 410,
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
    price: 430,
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
    price: 380,
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
    price: 780,
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
    price: 790,
    rarity: "epic",
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
    price: 140,
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
    price: 150,
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
    price: 370,
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
    price: 810,
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
    price: 400,
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
    price: 770,
    rarity: "epic",
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
    price: 165,
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
    price: 385,
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
    price: 415,
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
    price: 830,
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
    price: 850,
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
    name: "Spirit Dokkaebi",
    krName: "정령 도깨비",
    slot: "friend",
    price: 1050,
    rarity: "legendary",
    icon: "\ud83d\udc79",
    scene: {
      layer: "front",
      draw: () => (
        <g>
          <SpiritDefs />
          <g transform="translate(160 200) scale(1.35)">
            <SpiritDokkaebi />
          </g>
        </g>
      ),
    },
  },
  {
    id: "spirit-deer",
    name: "Forest Spirit Deer",
    krName: "정령 사슴",
    slot: "friend",
    price: 840,
    rarity: "epic",
    minPlayerLevel: 40,
    icon: "\ud83e\udd8c",
    scene: {
      layer: "front",
      draw: () => (
        <g>
          <SpiritDefs />
          <g transform="translate(42 196) scale(1)">
            <SpiritDeer />
          </g>
        </g>
      ),
    },
  },
  {
    id: "dragon",
    name: "Baby Spirit Dragon",
    krName: "아기 드래곤",
    slot: "friend",
    price: 1080,
    rarity: "legendary",
    minPlayerLevel: 100,
    icon: "\ud83d\udc09",
    scene: {
      layer: "front",
      draw: () => (
        <g>
          <SpiritDefs />
          <g transform="translate(180 205) scale(1.4)">
            <BabyDragon />
          </g>
        </g>
      ),
    },
  },
  // ── Event skins: replace the tree while worn. Legendary, 2000 coins,
  // four-week windows (long enough to save up from zero at 15 coins per
  // activity). Historical-figure homages drawn as originals: court dress,
  // armour and a scholar's dopo are not copyrightable, and the third is a
  // deliberate two-person mashup, so none portrays a specific artwork.
  {
    id: "skin-hangul-king",
    name: "King of the Alphabet",
    krName: "한글대왕",
    slot: "skin",
    price: 2000,
    rarity: "legendary",
    icon: "\ud83d\udc51",
    availableFrom: "2026-09-25",
    availableUntil: "2026-10-22",
    creature: () => <KingSkin />,
  },
  {
    id: "skin-turtle-ship-admiral",
    name: "Turtle-Ship Admiral",
    krName: "거북선 장군",
    slot: "skin",
    price: 2000,
    rarity: "legendary",
    icon: "\u2694\ufe0f",
    availableFrom: "2027-04-14",
    availableUntil: "2027-05-11",
    creature: () => <AdmiralSkin />,
  },
  {
    id: "skin-scholar-painter",
    name: "Scholar-Painter",
    krName: "다산의 붓, 겸재의 옷",
    slot: "skin",
    price: 2000,
    rarity: "legendary",
    icon: "\ud83d\udd8c\ufe0f",
    availableFrom: "2027-06-02",
    availableUntil: "2027-06-29",
    creature: () => <ScholarSkin />,
  },
  ...RIBBON_COSTUMES,
];

export function costumeById(id: string) {
  return COSTUMES.find((c) => c.id === id);
}

/** The equipped skin among these costume ids, if any (one per slot). */
export function skinFor(costumeIds: string[]): Costume | null {
  for (const id of costumeIds) {
    const c = costumeById(id);
    if (c?.slot === "skin" && c.creature) return c;
  }
  return null;
}

/** The fair medal among these costume ids, if any (a learner wears at most one). */
export function ribbonFor(costumeIds: string[]) {
  return RIBBONS.find((r) => costumeIds.includes(r.id)) ?? null;
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

/** Announced but not yet on sale (window starts after today, UTC). */
export function isUpcoming(c: Costume, now: Date = new Date()): boolean {
  return !!c.availableFrom && now.toISOString().slice(0, 10) < c.availableFrom;
}

// Level gates are absolute now. They used to be waived for Kroot Plus
// subscribers; that tier was removed, so there is no longer any way past
// "Unlocks at Lv.X" other than growing the tree.
export function isLevelLocked(c: Costume, playerLevel: number): boolean {
  return !!c.minPlayerLevel && playerLevel < c.minPlayerLevel;
}
