import type { CefrLevel } from "@/lib/tree";
import { SPECIES, type TreeSpecies } from "@/lib/tree";
import { CostumeLayer } from "@/lib/costumes";

function Face({
  cx,
  cy,
  spread,
  size,
  ink,
}: {
  cx: number;
  cy: number;
  spread: number;
  size: number;
  ink: string;
}) {
  return (
    <>
      <circle className="blink" cx={cx - spread} cy={cy} r={size} fill={ink} />
      <circle className="blink d2" cx={cx + spread} cy={cy} r={size} fill={ink} />
      <circle cx={cx - spread * 1.7} cy={cy + size * 2.2} r={size * 1.2} fill="#FF9E7D" opacity=".55" />
      <circle cx={cx + spread * 1.7} cy={cy + size * 2.2} r={size * 1.2} fill="#FF9E7D" opacity=".55" />
      <path
        d={`M${cx - spread} ${cy + size * 2.4} Q${cx} ${cy + size * 3.6} ${cx + spread} ${cy + size * 2.4}`}
        stroke={ink}
        strokeWidth={size * 0.8}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

// One blossom / fruit / leaf, per the species' deco. Drawn centered on (0,0).
function Ornament({ theme, alt }: { theme: TreeSpecies; alt: boolean }) {
  switch (theme.deco) {
    case "blossom":
      return (
        <>
          <circle cx="0" cy="-5" r="3.8" fill={alt ? theme.petal2 : theme.petal} />
          <circle cx="4.8" cy="-1" r="3.8" fill={alt ? theme.petal2 : theme.petal} />
          <circle cx="2.8" cy="4.6" r="3.8" fill={alt ? theme.petal2 : theme.petal} />
          <circle cx="-2.8" cy="4.6" r="3.8" fill={alt ? theme.petal2 : theme.petal} />
          <circle cx="-4.8" cy="-1" r="3.8" fill={alt ? theme.petal2 : theme.petal} />
          <circle cx="0" cy="0" r="2.8" fill={theme.center} />
        </>
      );
    case "persimmon":
      return (
        <>
          <path d="M0 -10 L0 -6" stroke="#4E9A6D" strokeWidth="2" strokeLinecap="round" />
          <path d="M-4 -7 L4 -7 L0 -3 Z" fill="#5FA97C" />
          <circle cx="0" cy="0" r="6.5" fill={alt ? theme.petal2 : theme.petal} />
          <circle cx="-2" cy="-2" r="1.8" fill={theme.center} />
        </>
      );
    case "ginkgo":
      return (
        <>
          <path d="M0 6 L0 1" stroke="#B98A4D" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-7 -8 A9 9 0 0 1 7 -8 L0 1 Z" fill={alt ? theme.petal2 : theme.petal} />
          <path d="M0 -11 L0 -6" stroke={alt ? theme.petal : theme.petal2} strokeWidth="1.6" strokeLinecap="round" />
        </>
      );
    case "pine":
      return (
        <>
          <ellipse cx="0" cy="0" rx="4.6" ry="6.4" fill={alt ? theme.petal2 : theme.petal} />
          <path d="M-3.4 -2.4 Q0 -0.6 3.4 -2.4 M-3.4 1.2 Q0 3 3.4 1.2" stroke="#6B4A2E" strokeWidth="1.3" fill="none" />
        </>
      );
  }
}

// Broadleaf canopy shared by the four tree-shaped stages.
function RoundCanopy({ theme, size }: { theme: TreeSpecies; size: "sm" | "lg" }) {
  if (size === "sm") {
    return (
      <>
        <circle cx="110" cy="108" r="46" fill={theme.canopy[0]} />
        <circle cx="76" cy="126" r="26" fill={theme.canopy[1]} />
        <circle cx="144" cy="126" r="26" fill={theme.canopy[1]} />
        <circle cx="110" cy="76" r="26" fill={theme.canopy[2]} />
      </>
    );
  }
  return (
    <>
      <circle cx="110" cy="98" r="54" fill={theme.canopy[0]} />
      <circle cx="66" cy="118" r="28" fill={theme.canopy[1]} />
      <circle cx="154" cy="118" r="28" fill={theme.canopy[1]} />
      <circle cx="110" cy="60" r="30" fill={theme.canopy[2]} />
      <circle cx="80" cy="70" r="20" fill={theme.canopy[2]} opacity=".85" />
    </>
  );
}

// Layered conifer silhouette (pine). Same footprint as the round canopy so
// costume anchors still land sensibly.
function ConiferCanopy({ theme, size }: { theme: TreeSpecies; size: "sm" | "lg" }) {
  if (size === "sm") {
    return (
      <>
        <path d="M110 80 L154 140 L66 140 Z" fill={theme.canopy[0]} />
        <path d="M110 52 L142 102 L78 102 Z" fill={theme.canopy[1]} />
      </>
    );
  }
  return (
    <>
      <path d="M110 92 L176 168 L44 168 Z" fill={theme.canopy[2]} />
      <path d="M110 56 L162 124 L58 124 Z" fill={theme.canopy[0]} />
      <path d="M110 26 L146 84 L74 84 Z" fill={theme.canopy[1]} />
    </>
  );
}

// Ornament spots per canopy shape (big stages). The conifer list hugs the
// triangle silhouette so nothing floats in the sky.
const ROUND_SPOTS_C1: [number, number][] = [
  [78, 62], [142, 56], [58, 106], [162, 102], [98, 40], [128, 130], [110, 148],
];
const ROUND_SPOTS_C2: [number, number][] = [
  [76, 70], [144, 64], [58, 112], [162, 110], [100, 42], [122, 134], [88, 148],
];
const CONIFER_SPOTS: [number, number][] = [
  [110, 46], [92, 98], [128, 98], [72, 148], [148, 148], [110, 150],
];
// A lighter sprinkle for the growing stage, so the species reads before the
// blossoming stage arrives.
const ROUND_SPOTS_B2: [number, number][] = [[80, 62], [148, 72], [58, 112]];
const CONIFER_SPOTS_B2: [number, number][] = [[110, 70], [88, 122], [136, 128]];

export default function LevelCreature({
  level,
  costumeIds = [],
  species,
}: {
  /** Growth stage (player level band) — how big the tree is. */
  level: CefrLevel;
  costumeIds?: string[];
  /** Tree species (CEFR grade) — what kind of tree it is. Defaults to the stage. */
  species?: CefrLevel;
}) {
  const theme = SPECIES[species ?? level];
  const conifer = theme.shape === "conifer";
  const outfit = <CostumeLayer level={level} costumeIds={costumeIds} />;

  switch (level) {
    case "A1":
      // Seed — half-buried in a soil mound, fast asleep. zzz floats above.
      return (
        <>
          <ellipse cx="110" cy="207" rx="42" ry="10" fill="#C9A97C" />
          <ellipse cx="110" cy="202" rx="34" ry="8" fill="#D8C39C" />
          <g className="char-tumble">
            <g className="sway">
              <ellipse cx="110" cy="186" rx="24" ry="27" fill="#8A6B4A" />
              <ellipse cx="102" cy="175" rx="8" ry="10" fill="#A9865E" opacity=".6" />
              <path
                d="M110 159 C110 149 116 143 126 141 C124 151 118 157 110 159Z"
                fill={theme.canopy[0]}
              />
              {/* closed sleepy eyes */}
              <path d="M98 184 Q102 187 106 184" stroke="#5E4A34" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M114 184 Q118 187 122 184" stroke="#5E4A34" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <ellipse cx="110" cy="193" rx="2.6" ry="1.8" fill="#5E4A34" />
              <text x="138" y="160" fontSize="13" fontWeight="800" fill="#B9A88C">z</text>
              <text x="147" y="148" fontSize="17" fontWeight="800" fill="#CBBB9E">z</text>
              {outfit}
            </g>
          </g>
        </>
      );

    case "A2":
      // Sprout — cotyledon leaves spread like arms, sparkly first-day eyes.
      return (
        <>
          <ellipse cx="110" cy="212" rx="46" ry="11" fill="#E2D5B8" />
          <g className="char-stroll">
            <g className="sway">
            <path d="M110 200 C110 178 110 168 110 156" stroke="#4E9A6D" strokeWidth="6" strokeLinecap="round" />
            <path d="M110 178 C94 174 84 164 82 152 C98 154 108 164 110 176Z" fill={theme.canopy[0]} />
            <path d="M110 168 C126 164 136 154 138 142 C122 144 112 154 110 166Z" fill={theme.canopy[1]} />
            <circle cx="110" cy="140" r="20" fill={theme.canopy[0]} />
            <Face cx={110} cy={138} spread={6} size={2.6} ink={theme.ink} />
            {/* sparkle glints — everything is new and exciting */}
            <circle cx="105.5" cy="136.5" r="1" fill="#fff" />
            <circle cx="117.5" cy="136.5" r="1" fill="#fff" />
            <path d="M140 120 L142 125 L147 127 L142 129 L140 134 L138 129 L133 127 L138 125Z" fill="#FFD66B" />
            <path d="M84 128 L85.5 131.5 L89 133 L85.5 134.5 L84 138 L82.5 134.5 L79 133 L82.5 131.5Z" fill="#FFD66B" opacity=".8" />
            {outfit}
            </g>
          </g>
        </>
      );

    case "B1":
      // Young tree — one waving branch and the species' first blossom.
      return (
        <>
          <ellipse cx="110" cy="212" rx="82" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 205 C110 175 108 160 108 142" stroke="#8A6B4A" strokeWidth="13" strokeLinecap="round" />
            {conifer ? (
              <>
                <ConiferCanopy theme={theme} size="sm" />
                <Face cx={110} cy={118} spread={12} size={4.4} ink={theme.ink} />
              </>
            ) : (
              <>
                {/* waving branch — saying its first 안녕 */}
                <path d="M109 170 C126 166 136 158 140 148" stroke="#8A6B4A" strokeWidth="8" strokeLinecap="round" />
                <circle cx="146" cy="142" r="13" fill={theme.canopy[1]} />
                <RoundCanopy theme={theme} size="sm" />
                <Face cx={110} cy={108} spread={14} size={5} ink={theme.ink} />
              </>
            )}
            {/* first ornament, worn on the side of the canopy */}
            <g transform={conifer ? "translate(110 90) scale(.9)" : "translate(74 76)"}>
              <Ornament theme={theme} alt={false} />
            </g>
            {outfit}
          </g>
        </>
      );

    case "B2":
      // Growing tree — bigger canopy, taller trunk, a bluebird friend.
      return (
        <>
          <ellipse cx="110" cy="216" rx="88" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 208 C110 172 108 152 108 128" stroke="#8A6B4A" strokeWidth="15" strokeLinecap="round" />
            <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill="#8A6B4A" />
            <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill="#8A6B4A" />
            {conifer ? (
              <>
                <ConiferCanopy theme={theme} size="lg" />
                <Face cx={110} cy={140} spread={14} size={5} ink={theme.ink} />
              </>
            ) : (
              <>
                <RoundCanopy theme={theme} size="lg" />
                <Face cx={110} cy={100} spread={16} size={5.6} ink={theme.ink} />
              </>
            )}
            {(conifer ? CONIFER_SPOTS_B2 : ROUND_SPOTS_B2).map(([bx, by], i) => (
              <g key={i} transform={`translate(${bx} ${by})`}>
                <Ornament theme={theme} alt={i % 2 === 1} />
              </g>
            ))}
            {/* a bluebird friend has moved in */}
            <g transform="translate(166 52)">
              <path d="M0 0 C0 -7 5 -10 10 -10 C14 -10 17 -7 17 -3 C17 3 11 6 6 6 L-2 6 Z" fill="#7FB5E8" />
              <circle cx="11.5" cy="-4.5" r="1.6" fill="#1E3A5F" />
              <path d="M17 -3 L21 -1.5 L17 0" fill="#F5A623" />
              <path d="M-2 6 L-7 9" stroke="#7FB5E8" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M2 0 C4 -3 8 -3 10 0" stroke="#5E93C9" strokeWidth="1.6" fill="none" />
            </g>
            {outfit}
          </g>
        </>
      );

    case "C1":
      // Blossoming — the canopy dotted with the species' blossoms or young fruit.
      return (
        <>
          <ellipse cx="110" cy="216" rx="88" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 208 C110 172 108 152 108 128" stroke="#8A6B4A" strokeWidth="15" strokeLinecap="round" />
            <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill="#8A6B4A" />
            <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill="#8A6B4A" />
            {conifer ? <ConiferCanopy theme={theme} size="lg" /> : <RoundCanopy theme={theme} size="lg" />}
            {(conifer ? CONIFER_SPOTS : ROUND_SPOTS_C1).map(([bx, by], i) => (
              <g key={i} transform={`translate(${bx} ${by}) scale(1.1)`}>
                <Ornament theme={theme} alt={i % 2 === 1} />
              </g>
            ))}
            {/* petals / leaves drifting down */}
            {(theme.deco === "blossom" || theme.deco === "ginkgo") && (
              <>
                <ellipse cx="46" cy="168" rx="4" ry="2.4" fill={theme.petal2} transform="rotate(-24 46 168)" />
                <ellipse cx="176" cy="156" rx="4" ry="2.4" fill={theme.petal} transform="rotate(18 176 156)" />
                <ellipse cx="160" cy="188" rx="3.4" ry="2" fill={theme.petal2} transform="rotate(-10 160 188)" />
              </>
            )}
            {conifer ? (
              <Face cx={110} cy={140} spread={14} size={5} ink={theme.ink} />
            ) : (
              <Face cx={110} cy={100} spread={16} size={5.6} ink={theme.ink} />
            )}
            {outfit}
          </g>
        </>
      );

    case "C2":
      // Fully grown — the full harvest, a little crown, mastery sparkles.
      return (
        <>
          <ellipse cx="110" cy="216" rx="88" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 208 C110 172 108 152 108 128" stroke="#8A6B4A" strokeWidth="15" strokeLinecap="round" />
            <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill="#8A6B4A" />
            <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill="#8A6B4A" />
            {conifer ? <ConiferCanopy theme={theme} size="lg" /> : <RoundCanopy theme={theme} size="lg" />}
            {(conifer ? CONIFER_SPOTS : ROUND_SPOTS_C2).map(([fx, fy], i) => (
              <g key={i} transform={`translate(${fx} ${fy}) scale(1.35)`}>
                <Ornament theme={theme} alt={i % 3 === 2} />
              </g>
            ))}
            {conifer ? (
              <Face cx={110} cy={140} spread={14} size={5} ink={theme.ink} />
            ) : (
              <Face cx={110} cy={100} spread={16} size={5.6} ink={theme.ink} />
            )}
            {/* a little golden crown, tilted so hats still fit */}
            <g transform="translate(74 34) rotate(-14)">
              <path d="M-13 6 L-13 -4 L-7 1 L0 -8 L7 1 L13 -4 L13 6 Z" fill="#FFD66B" stroke="#E8B93E" strokeWidth="1.4" strokeLinejoin="round" />
              <circle cx="0" cy="-10" r="2" fill="#FF6B5B" />
            </g>
            {/* mastery sparkles */}
            <path d="M32 62 L34 67 L39 69 L34 71 L32 76 L30 71 L25 69 L30 67Z" fill="#FFD66B" />
            <path d="M186 78 L188 83 L193 85 L188 87 L186 92 L184 87 L179 85 L184 83Z" fill="#FFD66B" opacity=".85" />
            {outfit}
          </g>
        </>
      );
  }
}
