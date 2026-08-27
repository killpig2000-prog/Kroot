import type { CefrLevel } from "@/lib/tree";
import { SPECIES, type TreeSpecies } from "@/lib/tree";
import { CostumeLayer } from "@/lib/costumes";

/** Shift a #rrggbb color toward black (f<0) or white (f>0). */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (x: number) => {
    const v = Math.round(f < 0 ? x * (1 + f) : x + (255 - x) * f);
    return Math.min(255, Math.max(0, v));
  };
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((x) => ch(x).toString(16).padStart(2, "0"))
    .join("")}`;
}

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
  const glintR = size * 0.35;
  return (
    <>
      {/* eyes carry their glint so both blink together */}
      <g className="blink">
        <circle cx={cx - spread} cy={cy} r={size} fill={ink} />
        <circle cx={cx - spread + glintR} cy={cy - glintR} r={glintR} fill="#fff" />
      </g>
      <g className="blink d2">
        <circle cx={cx + spread} cy={cy} r={size} fill={ink} />
        <circle cx={cx + spread + glintR} cy={cy - glintR} r={glintR} fill="#fff" />
      </g>
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

// Soil mound with grass tufts and pebbles. `rx` matches the old bare ellipse
// so shadows stay under the character's footprint.
function Ground({ id, rx, cy }: { id: string; rx: number; cy: number }) {
  const lx = 110 - rx + 12;
  const rxx = 110 + rx - 12;
  return (
    <>
      <ellipse cx="110" cy={cy} rx={rx} ry={rx * 0.16} fill={`url(#${id}-soil)`} />
      <g stroke="#7BA05B" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d={`M${lx} ${cy - 3} q-1 -6 3 -9 M${lx + 4} ${cy - 2} q2 -5 6 -6`} />
        <path d={`M${rxx} ${cy - 4} q1 -6 -3 -9 M${rxx - 4} ${cy - 3} q-2 -5 -6 -6`} />
      </g>
      <circle cx={110 - rx * 0.55} cy={cy + 2} r="2.4" fill="#CBB08A" />
      <circle cx={110 + rx * 0.62} cy={cy + 3} r="2" fill="#D8C39C" />
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
          <circle cx="0" cy="0" r="6.5" fill={alt ? theme.petal2 : theme.petal} stroke="#D9731F" strokeWidth="1" />
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

// Broadleaf canopy shared by the four tree-shaped stages: a rim shadow
// underneath for depth, the cluster itself, then a soft gloss top-left.
function RoundCanopy({ theme, size }: { theme: TreeSpecies; size: "sm" | "lg" }) {
  const rim = shade(theme.canopy[2], -0.16);
  if (size === "sm") {
    return (
      <>
        <circle cx="110" cy="111" r="47" fill={rim} />
        <circle cx="76" cy="129" r="27" fill={rim} />
        <circle cx="144" cy="129" r="27" fill={rim} />
        <circle cx="110" cy="108" r="46" fill={theme.canopy[0]} />
        <circle cx="76" cy="126" r="26" fill={theme.canopy[1]} />
        <circle cx="144" cy="126" r="26" fill={theme.canopy[1]} />
        <circle cx="110" cy="76" r="26" fill={theme.canopy[2]} />
        <circle cx="92" cy="84" r="16" fill="#FFFFFF" opacity=".26" />
        <circle cx="72" cy="118" r="7" fill="#FFFFFF" opacity=".2" />
      </>
    );
  }
  return (
    <>
      <circle cx="110" cy="101" r="55" fill={rim} />
      <circle cx="66" cy="121" r="29" fill={rim} />
      <circle cx="154" cy="121" r="29" fill={rim} />
      <circle cx="110" cy="98" r="54" fill={theme.canopy[0]} />
      <circle cx="66" cy="118" r="28" fill={theme.canopy[1]} />
      <circle cx="154" cy="118" r="28" fill={theme.canopy[1]} />
      <circle cx="110" cy="60" r="30" fill={theme.canopy[2]} />
      <circle cx="80" cy="70" r="20" fill={theme.canopy[2]} opacity=".85" />
      <circle cx="90" cy="70" r="20" fill="#FFFFFF" opacity=".22" />
      <circle cx="62" cy="110" r="9" fill="#FFFFFF" opacity=".16" />
    </>
  );
}

// ── Cloud pine (민화 소나무) ─────────────────────────────────────────────
// The conifer species draws needle "cloud pads" on curved branches instead of
// stacked triangles: a bumpy bright top lobe over a darker underside. Pads are
// placed so the stage's costume anchors still land (hat on the top tuft, face
// on the crown cluster).
function bumpPath(cx: number, cy: number, w: number, h: number, n: number): string {
  let d = `M${cx - w / 2} ${cy}`;
  for (let i = 0; i < n; i++) {
    const x0 = cx - w / 2 + i * (w / n);
    const x1 = x0 + w / n;
    const k = i === 0 || i === n - 1 ? 1.25 : i % 2 ? 1.9 : 1.65;
    d += ` Q${(x0 + x1) / 2} ${cy - h * k} ${x1} ${cy}`;
  }
  return d;
}

export function Pad({ id, theme, cx, cy, w, h, tone }: { id: string; theme: TreeSpecies; cx: number; cy: number; w: number; h: number; tone: 0 | 1 | 2 }) {
  const n = Math.max(3, Math.round(w / 16));
  const under = bumpPath(cx, cy + h * 0.55, w * 1.02, h * 0.55, n + 1) + ` Q${cx + w * 0.1} ${cy + h * 1.15} ${cx - w / 2} ${cy + h * 0.55} Z`;
  const top = bumpPath(cx, cy, w, h, n) + ` Q${cx} ${cy + h * 0.6} ${cx - w / 2} ${cy} Z`;
  const fill = tone === 0 ? `url(#${id}-pine)` : tone === 1 ? theme.canopy[1] : `url(#${id}-pine2)`;
  const dark = shade(theme.canopy[2], -0.3);
  return (
    <>
      <path d={under} fill={dark} />
      <path d={top} fill={fill} />
      <path d={`M${cx - w * 0.3} ${cy - h * 1.05} q${w * 0.1} -${h * 0.45} ${w * 0.24} -${h * 0.3}`} stroke="#FFFFFF" strokeWidth="2.2" opacity=".3" fill="none" strokeLinecap="round" />
      <path d={`M${cx - w * 0.42} ${cy + h * 0.15} q${w * 0.15} ${h * 0.25} ${w * 0.32} ${h * 0.12}`} stroke={dark} strokeWidth="1.4" opacity=".5" fill="none" strokeLinecap="round" />
    </>
  );
}

export function PineCone({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="4.6" ry="6.4" fill="#8A6B4A" />
      <path d="M-3.4 -2.4 Q0 -0.6 3.4 -2.4 M-3.4 1.2 Q0 3 3.4 1.2 M-2.6 4 Q0 5.4 2.6 4" stroke="#5C4630" strokeWidth="1.3" fill="none" />
    </g>
  );
}

// Trunk + branches + pads for the young (sm) and grown (lg) pine. Face goes
// on the crown cluster at (110,108) for sm and (110,100) for lg — the same
// spots the round canopy uses, so COSTUME_ANCHORS stay valid.
function PineCanopy({ id, theme, size }: { id: string; theme: TreeSpecies; size: "sm" | "lg" }) {
  const bark = "#7A5A3A";
  if (size === "sm") {
    return (
      <>
        <path d="M110 205 C112 180 104 165 108 140 C110 120 106 100 108 68" stroke={`url(#${id}-trunk)`} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M109 150 C122 146 132 140 142 134" stroke={bark} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M108 168 C96 164 86 158 76 150" stroke={bark} strokeWidth="6" fill="none" strokeLinecap="round" />
        <Pad id={id} theme={theme} cx={146} cy={136} w={44} h={14} tone={1} />
        <Pad id={id} theme={theme} cx={74} cy={152} w={46} h={14} tone={0} />
        <Pad id={id} theme={theme} cx={98} cy={122} w={58} h={16} tone={2} />
        <Pad id={id} theme={theme} cx={124} cy={118} w={52} h={15} tone={1} />
        <Pad id={id} theme={theme} cx={110} cy={100} w={50} h={14} tone={0} />
        <Pad id={id} theme={theme} cx={110} cy={72} w={36} h={12} tone={1} />
      </>
    );
  }
  return (
    <>
      <path d="M110 208 C114 178 102 160 106 132 C110 110 100 92 106 70 C107 66 107 62 108 60" stroke={`url(#${id}-trunk)`} strokeWidth="15" fill="none" strokeLinecap="round" />
      <path d="M105 196 q4 -3 9 0 M104 178 q4 -3 9 0" stroke="#6E5238" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      <path d="M108 170 C120 166 140 160 156 150" stroke={bark} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Pad id={id} theme={theme} cx={156} cy={150} w={78} h={19} tone={1} />
      <path d="M106 150 C94 146 74 138 60 124" stroke={bark} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Pad id={id} theme={theme} cx={62} cy={122} w={70} h={18} tone={0} />
      <Pad id={id} theme={theme} cx={94} cy={116} w={72} h={20} tone={2} />
      <Pad id={id} theme={theme} cx={128} cy={110} w={66} h={19} tone={1} />
      <Pad id={id} theme={theme} cx={110} cy={90} w={64} h={18} tone={0} />
      <Pad id={id} theme={theme} cx={108} cy={62} w={48} h={15} tone={1} />
    </>
  );
}

// Trunk with a lit left edge and a couple of bark curves.
function Trunk({ id, d, width, bark }: { id: string; d: string; width: number; bark?: string }) {
  return (
    <>
      <path d={d} stroke={`url(#${id}-trunk)`} strokeWidth={width} strokeLinecap="round" />
      {bark && <path d={bark} stroke="#6E5238" strokeWidth="1.7" fill="none" strokeLinecap="round" />}
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
  [40, 108], [184, 140], [132, 50], [82, 82], [148, 100], [140, 138],
];
// A lighter sprinkle for the growing stage, so the species reads before the
// blossoming stage arrives.
const ROUND_SPOTS_B2: [number, number][] = [[80, 62], [148, 72], [58, 112]];
const CONIFER_SPOTS_B2: [number, number][] = [[40, 108], [184, 140], [132, 50]];

// Small stages get zoomed so they fill the 220x230 frame instead of hugging
// the bottom third. Costumes sit inside the group, so anchors scale along.
const STAGE_ZOOM: Record<CefrLevel, { s: number; cy: number }> = {
  A1: { s: 1.45, cy: 206 },
  A2: { s: 1.28, cy: 212 },
  B1: { s: 1.1, cy: 212 },
  B2: { s: 1, cy: 216 },
  C1: { s: 1, cy: 216 },
  C2: { s: 1, cy: 216 },
};

export default function LevelCreature({
  level,
  costumeIds = [],
  species,
  hideGround = false,
}: {
  /** Growth stage (player level band) — how big the tree is. */
  level: CefrLevel;
  costumeIds?: string[];
  /** Tree species (CEFR grade) — what kind of tree it is. Defaults to the stage. */
  species?: CefrLevel;
  /** VeteranTree draws its own ground further down; skip the stage's soil mound. */
  hideGround?: boolean;
}) {
  const theme = SPECIES[species ?? level];
  const conifer = theme.shape === "conifer";
  const outfit = <CostumeLayer level={level} costumeIds={costumeIds} />;

  // Gradient ids vary by species+stage so several different creatures can
  // share one page (league board); identical instances share identical defs.
  const id = `lc-${species ?? level}-${level}`;
  const zoom = STAGE_ZOOM[level];
  const defs = (
    <defs>
      <linearGradient id={`${id}-soil`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E6D3AC" />
        <stop offset="100%" stopColor="#C9AC7E" />
      </linearGradient>
      <linearGradient id={`${id}-trunk`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#9B7B57" />
        <stop offset="55%" stopColor="#8A6B4A" />
        <stop offset="100%" stopColor="#6E5238" />
      </linearGradient>
      <linearGradient id={`${id}-pine`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={shade(theme.canopy[1], 0.25)} />
        <stop offset="100%" stopColor={theme.canopy[0]} />
      </linearGradient>
      <linearGradient id={`${id}-pine2`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={theme.canopy[1]} />
        <stop offset="100%" stopColor={shade(theme.canopy[2], -0.3)} />
      </linearGradient>
      <radialGradient id={`${id}-seed`} cx="38%" cy="28%" r="78%">
        <stop offset="0%" stopColor="#B39066" />
        <stop offset="55%" stopColor="#8A6B4A" />
        <stop offset="100%" stopColor="#66492F" />
      </radialGradient>
      <radialGradient id={`${id}-head`} cx="38%" cy="30%" r="75%">
        <stop offset="0%" stopColor={shade(theme.canopy[1], 0.18)} />
        <stop offset="60%" stopColor={theme.canopy[0]} />
        <stop offset="100%" stopColor={shade(theme.canopy[2], -0.06)} />
      </radialGradient>
    </defs>
  );

  const frame = (children: React.ReactNode) => (
    <>
      {defs}
      <g transform={`translate(110 ${zoom.cy + zoom.s * 2}) scale(${zoom.s}) translate(-110 -${zoom.cy})`}>
        {children}
      </g>
    </>
  );

  switch (level) {
    case "A1":
      // Seed — half-buried in a soil mound, fast asleep. zzz floats above.
      return frame(
        <>
          {!hideGround && <Ground id={id} rx={46} cy={206} />}
          <ellipse cx="110" cy="202" rx="34" ry="7" fill="#DCC79E" />
          <g className="char-tumble">
            <g className="sway">
              <ellipse cx="110" cy="185" rx="25" ry="28" fill={`url(#${id}-seed)`} stroke="#5E4A34" strokeWidth="2" />
              <ellipse cx="101" cy="171" rx="7.5" ry="10" fill="#C8A87E" opacity=".55" />
              <path d="M104 190 q-8 1 -11 6" stroke="#6E5238" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".6" />
              <path
                d="M110 158 C110 147 117 141 128 139 C126 150 119 156 110 158Z"
                fill={theme.canopy[0]}
                stroke={shade(theme.canopy[2], -0.2)}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M112 156 C116 151 120 146 124 143" stroke={shade(theme.canopy[2], -0.2)} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              {/* closed sleepy eyes */}
              <path d="M97 183 Q101 186.5 105 183" stroke="#4A3826" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <path d="M115 183 Q119 186.5 123 183" stroke="#4A3826" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              <circle cx="93" cy="190" r="4" fill="#FF9E7D" opacity=".5" />
              <circle cx="127" cy="190" r="4" fill="#FF9E7D" opacity=".5" />
              <ellipse cx="110" cy="192" rx="2.6" ry="1.9" fill="#4A3826" />
              <text x="136" y="160" fontSize="12" fontWeight="800" fill="#A9987C" opacity=".9">z</text>
              <text x="145" y="149" fontSize="15" fontWeight="800" fill="#B9A88C" opacity=".7">z</text>
              <text x="155" y="138" fontSize="18" fontWeight="800" fill="#CBBB9E" opacity=".5">z</text>
              {outfit}
            </g>
          </g>
        </>
      );

    case "A2":
      // Sprout — cotyledon leaves spread like arms, sparkly first-day eyes.
      return frame(
        <>
          {!hideGround && <Ground id={id} rx={48} cy={212} />}
          <g className="char-stroll">
            <g className="sway">
              <path d="M110 205 C110 180 110 168 110 156" stroke="#4E9A6D" strokeWidth="6.5" strokeLinecap="round" />
              <path
                d="M110 178 C94 174 84 164 82 152 C98 154 108 164 110 176Z"
                fill={theme.canopy[0]}
                stroke={shade(theme.canopy[2], -0.18)}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M108 172 C100 168 93 162 89 156" stroke={shade(theme.canopy[2], -0.18)} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <path
                d="M110 168 C126 164 136 154 138 142 C122 144 112 154 110 166Z"
                fill={theme.canopy[1]}
                stroke={shade(theme.canopy[2], -0.12)}
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M112 162 C120 158 127 152 131 146" stroke={shade(theme.canopy[2], -0.12)} strokeWidth="1.2" fill="none" strokeLinecap="round" />
              <circle cx="110" cy="140" r="21" fill={`url(#${id}-head)`} stroke={shade(theme.canopy[2], -0.18)} strokeWidth="1.8" />
              <circle cx="104" cy="133" r="6" fill="#FFFFFF" opacity=".3" />
              <Face cx={110} cy={138} spread={6} size={2.6} ink={theme.ink} />
              <path d="M140 118 L142.4 124 L148.4 126.4 L142.4 128.8 L140 134.8 L137.6 128.8 L131.6 126.4 L137.6 124Z" fill="#FFD66B" stroke="#E8B93E" strokeWidth="1" />
              <path d="M83 126 L84.6 129.8 L88.4 131.4 L84.6 133 L83 136.8 L81.4 133 L77.6 131.4 L81.4 129.8Z" fill="#FFD66B" opacity=".85" />
              {outfit}
            </g>
          </g>
        </>
      );

    case "B1":
      // Young tree — one waving branch and the species' first blossom.
      return frame(
        <>
          {!hideGround && <Ground id={id} rx={82} cy={212} />}
          <g className="sway">
            {!conifer && <Trunk id={id} d="M110 205 C110 175 108 160 108 142" width={13} bark="M106 196 q3 -3 6 0 M107 184 q3 -3 6 0" />}
            {conifer ? (
              <>
                <PineCanopy id={id} theme={theme} size="sm" />
                <Face cx={110} cy={108} spread={11} size={4.2} ink="#F1EDE6" />
              </>
            ) : (
              <>
                {/* waving branch — saying its first 안녕 */}
                <path d="M109 170 C126 166 136 158 140 148" stroke={`url(#${id}-trunk)`} strokeWidth="8" strokeLinecap="round" />
                <circle cx="146" cy="142" r="13" fill={theme.canopy[1]} />
                <RoundCanopy theme={theme} size="sm" />
                <Face cx={110} cy={108} spread={14} size={5} ink={theme.ink} />
              </>
            )}
            {/* first ornament, worn on the side of the canopy */}
            <g transform={conifer ? "translate(150 122) scale(.9)" : "translate(74 76)"}>
              <Ornament theme={theme} alt={false} />
            </g>
            {outfit}
          </g>
        </>
      );

    case "B2":
      // Growing tree — bigger canopy, taller trunk, a bluebird friend.
      return frame(
        <>
          {!hideGround && <Ground id={id} rx={88} cy={216} />}
          <g className="sway">
            {!conifer && (
              <>
                <Trunk id={id} d="M110 208 C110 172 108 152 108 128" width={15} bark="M105 196 q4 -3 8 0 M106 182 q4 -3 8 0" />
                <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill={`url(#${id}-trunk)`} />
                <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill={`url(#${id}-trunk)`} />
              </>
            )}
            {conifer ? (
              <>
                <PineCanopy id={id} theme={theme} size="lg" />
                <Face cx={110} cy={100} spread={13} size={4.8} ink="#F1EDE6" />
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
      return frame(
        <>
          {!hideGround && <Ground id={id} rx={88} cy={216} />}
          <g className="sway">
            {!conifer && (
              <>
                <Trunk id={id} d="M110 208 C110 172 108 152 108 128" width={15} bark="M105 196 q4 -3 8 0 M106 182 q4 -3 8 0" />
                <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill={`url(#${id}-trunk)`} />
                <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill={`url(#${id}-trunk)`} />
              </>
            )}
            {conifer ? <PineCanopy id={id} theme={theme} size="lg" /> : <RoundCanopy theme={theme} size="lg" />}
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
              <Face cx={110} cy={100} spread={13} size={4.8} ink="#F1EDE6" />
            ) : (
              <Face cx={110} cy={100} spread={16} size={5.6} ink={theme.ink} />
            )}
            {outfit}
          </g>
        </>
      );

    case "C2":
      // Fully grown — the full harvest, a little crown, mastery sparkles.
      return frame(
        <>
          {!hideGround && <Ground id={id} rx={88} cy={216} />}
          <g className="sway">
            {!conifer && (
              <>
                <Trunk id={id} d="M110 208 C110 172 108 152 108 128" width={15} bark="M105 196 q4 -3 8 0 M106 182 q4 -3 8 0" />
                <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill={`url(#${id}-trunk)`} />
                <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill={`url(#${id}-trunk)`} />
              </>
            )}
            {conifer ? <PineCanopy id={id} theme={theme} size="lg" /> : <RoundCanopy theme={theme} size="lg" />}
            {(conifer ? CONIFER_SPOTS : ROUND_SPOTS_C2).map(([fx, fy], i) => (
              <g key={i} transform={`translate(${fx} ${fy}) scale(1.35)`}>
                <Ornament theme={theme} alt={i % 3 === 2} />
              </g>
            ))}
            {conifer ? (
              <Face cx={110} cy={100} spread={13} size={4.8} ink="#F1EDE6" />
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
