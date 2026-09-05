import type { CefrLevel } from "@/lib/tree";
import { SPECIES } from "@/lib/tree";
import { FULLY_GROWN_LEVEL, MAX_LEVEL, VETERAN_TIER_SPAN, treeHeightMetres, veteranTiers } from "@/lib/level";
import LevelCreature, { Pad } from "@/components/dashboard/LevelCreature";

// Keepsakes hung on the tree, one per canopy tier past fully grown.
// `name` is rendered from messages (dashboard.tree.keepsakes.<level>).
export const VETERAN_MILESTONES: { level: number; kr: string }[] = [
  { level: 60, kr: "둥지" },
  { level: 70, kr: "그네" },
  { level: 80, kr: "새집" },
  { level: 90, kr: "등불" },
  { level: 100, kr: "트리하우스" },
  { level: 110, kr: "풍향계" },
  { level: 120, kr: "별" },
];

// How much taller the frame gets per level past 50 (SVG units).
const PX_PER_LEVEL = 4;
export const BASE_HEIGHT = 230;
// Keepsakes are drawn at this scale — at 1× they vanished in the ranking
// thumbnails and read as specks even on the dashboard card.
const KEEPSAKE_SCALE = 1.7;

/** viewBox height for a given player level — TreeCard sizes the frame with this. */
export function veteranFrameHeight(level: number): number {
  const lv = Math.min(Math.max(level, FULLY_GROWN_LEVEL), MAX_LEVEL);
  return BASE_HEIGHT + (lv - FULLY_GROWN_LEVEL) * PX_PER_LEVEL;
}

function Keepsake({ level, x, y, dir }: { level: number; x: number; y: number; dir: 1 | -1 }) {
  const wrap = (children: React.ReactNode) => (
    <g transform={`translate(${x} ${y}) scale(${KEEPSAKE_SCALE})`}>{children}</g>
  );
  switch (level) {
    case 60:
      return wrap(
        <>
          <ellipse cx="0" cy="0" rx="11" ry="6" fill="#C9A06A" />
          <path d="M-9 0 q4 -3 9 -1 q4 -2 9 1" stroke="#9C7A4A" strokeWidth="1.2" fill="none" />
          <circle cx="-3" cy="-3" r="3" fill="#BFE3F5" />
          <circle cx="4" cy="-3" r="3" fill="#BFE3F5" />
        </>
      );
    case 70:
      return wrap(
        <>
          <line x1="-8" x2="-8" y1="0" y2="24" stroke="#D9C2A0" strokeWidth="2" />
          <line x1="8" x2="8" y1="0" y2="24" stroke="#D9C2A0" strokeWidth="2" />
          <rect x="-12" y="23" width="24" height="5" rx="2" fill="#A97142" />
        </>
      );
    case 80:
      return wrap(
        <>
          <rect x="-9" y="-4" width="18" height="16" rx="2" fill="#F6D7B0" />
          <path d="M-12 -3 L0 -13 L12 -3Z" fill="#D9534F" />
          <circle cx="0" cy="4" r="3.5" fill="#3B2A1E" />
        </>
      );
    case 90:
      return wrap(
        <>
          <path d={`M${-30 * dir} -2 Q0 12 ${30 * dir} -2`} stroke="#7A5E1E" strokeWidth="1.5" fill="none" />
          {[-0.5, -0.17, 0.17, 0.5].map((f) => (
            <rect key={f} x={f * 60 - 4} y={4 - Math.abs(f) * 8} width="8" height="11" rx="3" fill="#FFB347" />
          ))}
        </>
      );
    case 100:
      return wrap(
        <>
          <rect x="-24" y="-12" width="48" height="24" rx="3" fill="#E8C39E" />
          <path d="M-28 -11 L0 -27 L28 -11Z" fill="#B85C38" />
          <rect x="-5" y="-1" width="10" height="13" rx="1" fill="#6B3F2A" />
          <rect x="8" y="-7" width="8" height="7" fill="#BFE3F5" />
          <rect x="-16" y="-7" width="8" height="7" fill="#BFE3F5" />
        </>
      );
    case 110:
      return wrap(
        <>
          <line x1="0" x2="0" y1="0" y2="-18" stroke="#6B6560" strokeWidth="2" />
          <path d="M-6 -14 l14 -4 l-14 -4z" fill="#D9534F" />
        </>
      );
    case 120:
      return wrap(
        <path d="M0 -12 l4 9 l10 1 l-7 6 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -6 l10 -1z" fill="#FDE047" stroke="#F59E0B" />
      );
    default:
      return null;
  }
}

// One round-species foliage cluster: a shaded underside, two mid lobes, a
// lit top lobe and a highlight — so tiers read as leaves on a branch rather
// than the three flat circles they used to be.
function Foliage({
  cx,
  cy,
  w,
  tone,
  canopy,
  petal,
  petal2,
  center,
}: {
  cx: number;
  cy: number;
  w: number;
  tone: 0 | 1 | 2;
  canopy: readonly [string, string, string];
  petal: string;
  petal2: string;
  center: string;
}) {
  const r = w * 0.5;
  const mid = canopy[tone % 2];
  return (
    <g>
      <ellipse cx={cx} cy={cy + 6} rx={r * 1.05} ry={r * 0.55} fill={canopy[2]} />
      <ellipse cx={cx - r * 0.5} cy={cy} rx={r * 0.62} ry={r * 0.5} fill={mid} />
      <ellipse cx={cx + r * 0.5} cy={cy + 1} rx={r * 0.6} ry={r * 0.48} fill={mid} />
      <ellipse cx={cx} cy={cy - 8} rx={r * 0.7} ry={r * 0.52} fill={canopy[1]} />
      <ellipse cx={cx - r * 0.2} cy={cy - 13} rx={r * 0.32} ry={r * 0.2} fill="#FFFFFF" opacity=".28" />
      <circle cx={cx + r * 0.35} cy={cy - 4} r="4.5" fill={petal} />
      <circle cx={cx + r * 0.35} cy={cy - 4} r="1.9" fill={center} />
      <circle cx={cx - r * 0.45} cy={cy + 3} r="3.8" fill={petal2} />
    </g>
  );
}

/**
 * The Lv.50+ tree. The fully-grown creature keeps its place at the top of
 * the frame (so faces, crown, and costume anchors are untouched) and the
 * trunk extends *downward* as the frame grows taller — every 10 levels adds
 * a branch with its own foliage and a keepsake hung on it. The trunk widens
 * toward the ground, with roots, moss and (from three tiers on) a mushroom
 * at the base, so age reads in the silhouette and not only in the height.
 * Renders inside an SVG whose viewBox is 220 × veteranFrameHeight(level).
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
    const side: 1 | -1 = fromGround % 2 ? 1 : -1;
    const w = 40 + fromGround * 4.5;
    const reach = 36 + fromGround * 5;
    return {
      level: FULLY_GROWN_LEVEL + (fromGround + 1) * VETERAN_TIER_SPAN,
      w,
      side,
      reach,
      ex: 110 + side * reach,
      tone: (fromGround % 3) as 0 | 1 | 2,
      thick: 6 + Math.max(0, 3 - (fromGround % 3)),
    };
  };

  // Trunk: 14 wide where it meets the creature, up to 30 at the ground.
  const baseW = 14 + Math.min(16, tiers * 2.5);

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
        {extra > 0 && (
          <>
            {/* tapered trunk from the base creature down to the ground */}
            <path
              d={`M103 200 L${110 - baseW / 2} ${groundY + 4} Q110 ${groundY + 10} ${110 + baseW / 2} ${groundY + 4} L117 200Z`}
              fill="#8A6B4A"
            />
            <path
              d={`M105 200 L${110 - baseW / 2 + 4} ${groundY + 2} L${110 - baseW / 2 + 8} ${groundY + 2} L108 200Z`}
              fill="#9B7B57"
            />
            {/* roots, moss, and a mushroom once the tree has some age */}
            <path d={`M${110 - baseW / 2} ${groundY + 2} q-14 4 -24 2`} stroke="#8A6B4A" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d={`M${110 + baseW / 2} ${groundY + 2} q14 4 24 2`} stroke="#8A6B4A" strokeWidth="5" fill="none" strokeLinecap="round" />
            <ellipse cx={110 - baseW / 2 + 2} cy={groundY - 6} rx="9" ry="5" fill="#6FA37A" />
            <ellipse cx={110 + baseW / 2 - 1} cy={groundY - 14} rx="6" ry="4" fill="#7FB58A" />
            {tiers >= 3 && (
              <g transform={`translate(${110 + baseW / 2 + 14} ${groundY + 2})`}>
                <rect x="-2" y="-6" width="4" height="7" fill="#F1E3C6" />
                <ellipse cx="0" cy="-7" rx="6" ry="4" fill="#D9534F" />
                <circle cx="-2" cy="-8" r="1" fill="#FFFFFF" />
                <circle cx="2" cy="-7" r="1" fill="#FFFFFF" />
              </g>
            )}
          </>
        )}

        {/* branches first, then every foliage cluster, then every keepsake on
            top — so a lower tier never hides the one above it */}
        {tierYs.map((y, i) => {
          const t = tierInfo(i);
          return (
            <path
              key={`b${t.level}`}
              d={`M110 ${y + 10} Q${110 + t.side * t.reach * 0.5} ${y + 8} ${t.ex} ${y - 6}`}
              stroke="#7A5A3A"
              strokeWidth={t.thick}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}
        {tierYs.map((y, i) => {
          const t = tierInfo(i);
          return conifer ? (
            <Pad key={`f${t.level}`} id="lc-C2-C2" theme={theme} cx={t.ex} cy={y - 10} w={t.w + 14} h={20} tone={t.tone} />
          ) : (
            <Foliage
              key={`f${t.level}`}
              cx={t.ex}
              cy={y - 14}
              w={t.w}
              tone={t.tone}
              canopy={theme.canopy}
              petal={theme.petal}
              petal2={theme.petal2}
              center={theme.center}
            />
          );
        })}
        {tierYs.map((y, i) => {
          const t = tierInfo(i);
          const kx = t.level === 100 ? 110 : t.ex + t.side * 4;
          const ky = t.level === 100 ? y - 2 : conifer ? y - 2 : y + 6;
          return <Keepsake key={`k${t.level}`} level={t.level} x={kx} y={ky} dir={t.side} />;
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
