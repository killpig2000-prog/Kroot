import type { CefrLevel } from "@/lib/tree";
import { SPECIES } from "@/lib/tree";
import { FULLY_GROWN_LEVEL, MAX_LEVEL, VETERAN_TIER_SPAN, treeHeightMetres, veteranTiers } from "@/lib/level";
import LevelCreature from "@/components/dashboard/LevelCreature";

// Keepsakes hung on the tree, one per canopy tier past fully grown.
export const VETERAN_MILESTONES: { level: number; name: string; kr: string }[] = [
  { level: 60, name: "Bird's nest", kr: "둥지" },
  { level: 70, name: "Rope swing", kr: "그네" },
  { level: 80, name: "Birdhouse", kr: "새집" },
  { level: 90, name: "Lantern string", kr: "등불" },
  { level: 100, name: "Treehouse", kr: "트리하우스" },
  { level: 110, name: "Weather vane", kr: "풍향계" },
  { level: 120, name: "Star topper", kr: "별" },
];

// How much taller the frame gets per level past 50 (SVG units).
const PX_PER_LEVEL = 4;
export const BASE_HEIGHT = 230;

/** viewBox height for a given player level — TreeCard sizes the frame with this. */
export function veteranFrameHeight(level: number): number {
  const lv = Math.min(Math.max(level, FULLY_GROWN_LEVEL), MAX_LEVEL);
  return BASE_HEIGHT + (lv - FULLY_GROWN_LEVEL) * PX_PER_LEVEL;
}

function Keepsake({ level, x, y, dir }: { level: number; x: number; y: number; dir: 1 | -1 }) {
  switch (level) {
    case 60:
      return (
        <g transform={`translate(${x} ${y})`}>
          <ellipse cx="0" cy="0" rx="11" ry="6" fill="#C9A06A" />
          <path d="M-9 0 q4 -3 9 -1 q4 -2 9 1" stroke="#9C7A4A" strokeWidth="1.2" fill="none" />
          <circle cx="-3" cy="-3" r="3" fill="#BFE3F5" />
          <circle cx="4" cy="-3" r="3" fill="#BFE3F5" />
        </g>
      );
    case 70:
      return (
        <g transform={`translate(${x} ${y})`}>
          <line x1="-8" x2="-8" y1="0" y2="28" stroke="#D9C2A0" strokeWidth="2" />
          <line x1="8" x2="8" y1="0" y2="28" stroke="#D9C2A0" strokeWidth="2" />
          <rect x="-12" y="27" width="24" height="5" rx="2" fill="#A97142" />
        </g>
      );
    case 80:
      return (
        <g transform={`translate(${x} ${y})`}>
          <rect x="-9" y="-4" width="18" height="16" rx="2" fill="#F6D7B0" />
          <path d="M-12 -3 L0 -13 L12 -3Z" fill="#D9534F" />
          <circle cx="0" cy="4" r="3.5" fill="#3B2A1E" />
        </g>
      );
    case 90:
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d={`M${-40 * dir} -2 Q0 14 ${40 * dir} -2`} stroke="#7A5E1E" strokeWidth="1.5" fill="none" />
          {[-0.5, -0.17, 0.17, 0.5].map((f) => (
            <rect key={f} x={f * 80 - 4} y={4 - Math.abs(f) * 8} width="8" height="11" rx="3" fill="#FFB347" />
          ))}
        </g>
      );
    case 100:
      return (
        <g transform={`translate(${x} ${y})`}>
          <rect x="-26" y="-14" width="52" height="26" rx="3" fill="#E8C39E" />
          <path d="M-30 -13 L0 -30 L30 -13Z" fill="#B85C38" />
          <rect x="-5" y="-2" width="10" height="14" rx="1" fill="#6B3F2A" />
          <rect x="9" y="-8" width="9" height="8" fill="#BFE3F5" />
          <rect x="-18" y="-8" width="9" height="8" fill="#BFE3F5" />
        </g>
      );
    case 110:
      return (
        <g transform={`translate(${x} ${y})`}>
          <line x1="0" x2="0" y1="0" y2="-20" stroke="#6B6560" strokeWidth="2" />
          <path d="M-6 -16 l14 -4 l-14 -4z" fill="#D9534F" />
        </g>
      );
    case 120:
      return (
        <g transform={`translate(${x} ${y})`}>
          <path d="M0 -12 l4 9 l10 1 l-7 6 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -6 l10 -1z" fill="#FDE047" stroke="#F59E0B" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * The Lv.50+ tree. The fully-grown creature keeps its place at the top of
 * the frame (so faces, crown, and costume anchors are untouched) and the
 * trunk extends *downward* as the frame grows taller — every 10 levels adds a
 * canopy tier with a keepsake hung on it. Renders inside an SVG whose viewBox
 * is 220 × veteranFrameHeight(level).
 */
export default function VeteranTree({
  level,
  species,
  costumeIds = [],
}: {
  level: number;
  species: CefrLevel;
  costumeIds?: string[];
}) {
  const theme = SPECIES[species];
  const conifer = theme.shape === "conifer";
  const H = veteranFrameHeight(level);
  const extra = H - BASE_HEIGHT;
  const tiers = veteranTiers(level);
  const groundY = 208 + extra; // the base creature's trunk ends at y=208
  const metres = treeHeightMetres(level);
  const topY = 26;

  // Tiers sit evenly along the extension, lowest = oldest = widest.
  const tierYs = Array.from({ length: tiers }, (_, i) => 208 + ((i + 1) * extra) / (tiers + 1));
  // tierYs[0] hangs just under the base; the lowest tier is the oldest
  // keepsake (Lv.60), so milestones count from the ground up.
  const tierInfo = (i: number) => {
    const fromGround = tiers - 1 - i;
    const w = 44 + fromGround * 5;
    const side: 1 | -1 = fromGround % 2 ? 1 : -1;
    return {
      level: FULLY_GROWN_LEVEL + (fromGround + 1) * VETERAN_TIER_SPAN,
      w,
      side,
      conifer,
      fill: theme.canopy[fromGround % 2 ? 1 : 0],
      kx: 110 + side * w * 0.55,
    };
  };

  return (
    <>
      {/* height ruler along the left edge */}
      <g opacity=".55">
        <line x1="22" x2="22" y1={groundY + 8} y2={topY} stroke={theme.ink} strokeWidth="1.5" />
        {Array.from({ length: Math.floor(metres) + 1 }, (_, m) => {
          const y = groundY + 8 - (m / metres) * (groundY + 8 - topY);
          return (
            <g key={m}>
              <line x1="16" x2="28" y1={y} y2={y} stroke={theme.ink} strokeWidth="1.5" />
              <text x="32" y={y + 3} fontSize="8" fontWeight="800" fill={theme.ink}>
                {m}m
              </text>
            </g>
          );
        })}
      </g>

      {/* ground, pushed down to the bottom of the taller frame */}
      <ellipse cx="110" cy={groundY + 8} rx="88" ry="14" fill="#D9C39A" />
      <ellipse cx="110" cy={groundY + 6} rx="80" ry="10" fill="#E6D3AC" />

      <g className="sway" style={{ transformOrigin: `110px ${groundY}px` }}>
        {/* trunk extension from the base creature down to the ground */}
        {extra > 0 && (
          <>
            <rect x="101.5" y="200" width="15" height={extra + 10} rx="2" fill="#8A6B4A" />
            <rect x="101.5" y="200" width="4" height={extra + 10} fill="#9B7B57" />
            {tierYs.map((y, i) => (
              <path key={i} d={`M105 ${y + 12} q4 -3 8 0`} stroke="#6E5238" strokeWidth="1.7" fill="none" strokeLinecap="round" />
            ))}
          </>
        )}

        {/* canopy tiers, bottom = oldest = widest — canopies first, then every
            keepsake on top so a lower tier never hides the one above it */}
        {tierYs.map((y, i) => {
          const t = tierInfo(i);
          return t.conifer ? (
            <path key={t.level} d={`M110 ${y - 30} L${110 - t.w} ${y + 6} Q110 ${y - 2} ${110 + t.w} ${y + 6} Z`} fill={t.fill} />
          ) : (
            <g key={t.level}>
              <circle cx={110 - t.w * 0.6} cy={y} r={t.w * 0.44} fill={theme.canopy[1]} />
              <circle cx={110 + t.w * 0.6} cy={y} r={t.w * 0.44} fill={theme.canopy[1]} />
              <circle cx="110" cy={y - 8} r={t.w * 0.5} fill={t.fill} />
            </g>
          );
        })}
        {tierYs.map((y, i) => {
          const t = tierInfo(i);
          return <Keepsake key={t.level} level={t.level} x={t.level === 100 ? 110 : t.kx} y={y - 4} dir={t.side} />;
        })}

        {/* the fully-grown creature, untouched, at the top */}
        <LevelCreature level="C2" species={species} costumeIds={costumeIds} hideGround />
      </g>

      {/* the taller it gets, the more sky it lives in */}
      {level >= 80 && (
        <g className="bob2" opacity=".9">
          <ellipse cx="54" cy={topY + 150} rx="20" ry="7" fill="#fff" />
          <ellipse cx="68" cy={topY + 146} rx="13" ry="6" fill="#fff" />
        </g>
      )}
      {level >= 100 && (
        <g className="bob" opacity=".85">
          <ellipse cx="170" cy={topY + 230} rx="18" ry="6" fill="#fff" />
          <ellipse cx="184" cy={topY + 227} rx="11" ry="5" fill="#fff" />
        </g>
      )}
    </>
  );
}
