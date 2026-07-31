import type { CefrLevel } from "@/lib/tree";
import { CostumeLayer } from "@/lib/costumes";

function Face({ cx, cy, spread, size }: { cx: number; cy: number; spread: number; size: number }) {
  return (
    <>
      <circle className="blink" cx={cx - spread} cy={cy} r={size} fill="#2E5B41" />
      <circle className="blink d2" cx={cx + spread} cy={cy} r={size} fill="#2E5B41" />
      <circle cx={cx - spread * 1.7} cy={cy + size * 2.2} r={size * 1.2} fill="#FF9E7D" opacity=".55" />
      <circle cx={cx + spread * 1.7} cy={cy + size * 2.2} r={size * 1.2} fill="#FF9E7D" opacity=".55" />
      <path
        d={`M${cx - spread} ${cy + size * 2.4} Q${cx} ${cy + size * 3.6} ${cx + spread} ${cy + size * 2.4}`}
        stroke="#2E5B41"
        strokeWidth={size * 0.8}
        fill="none"
        strokeLinecap="round"
      />
    </>
  );
}

export default function LevelCreature({
  level,
  costumeIds = [],
}: {
  level: CefrLevel;
  costumeIds?: string[];
}) {
  const outfit = <CostumeLayer level={level} costumeIds={costumeIds} />;
  switch (level) {
    case "A1":
      // Seed — tucked in the soil, eyes still closed, not sprouted yet.
      return (
        <>
          <ellipse cx="110" cy="207" rx="30" ry="9" fill="#D8C39C" />
          <g className="char-tumble">
            <g className="sway">
              <ellipse cx="110" cy="188" rx="24" ry="28" fill="#8A6B4A" />
              <ellipse cx="102" cy="176" rx="8" ry="10" fill="#A9865E" opacity=".6" />
              <path
                d="M110 160 C110 150 116 144 126 142 C124 152 118 158 110 160Z"
                fill="#6BBF8A"
              />
              <path d="M100 196 Q110 200 120 196" stroke="#5E4A34" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              {outfit}
            </g>
          </g>
        </>
      );

    case "A2":
      // Sprout — two little leaves, first small face.
      return (
        <>
          <ellipse cx="110" cy="212" rx="46" ry="11" fill="#E2D5B8" />
          <g className="char-stroll">
            <g className="sway">
            <path d="M110 200 C110 178 110 168 110 156" stroke="#4E9A6D" strokeWidth="6" strokeLinecap="round" />
            <path d="M110 178 C94 174 84 164 82 152 C98 154 108 164 110 176Z" fill="#6BBF8A" />
            <path d="M110 168 C126 164 136 154 138 142 C122 144 112 154 110 166Z" fill="#7FCB99" />
            <circle cx="110" cy="140" r="20" fill="#6BBF8A" />
            <Face cx={110} cy={138} spread={6} size={2.6} />
            {outfit}
            </g>
          </g>
        </>
      );

    case "B1":
      // Young tree — the original everyday look.
      return (
        <>
          <ellipse cx="110" cy="212" rx="82" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 205 C110 175 108 160 108 142" stroke="#8A6B4A" strokeWidth="13" strokeLinecap="round" />
            <path d="M108 168 C92 162 82 150 80 136 C96 140 105 152 108 164Z" fill="#8A6B4A" />
            <circle cx="110" cy="108" r="46" fill="#6BBF8A" />
            <circle cx="76" cy="126" r="26" fill="#7FCB99" />
            <circle cx="144" cy="126" r="26" fill="#7FCB99" />
            <circle cx="110" cy="76" r="26" fill="#5AB07E" />
            <Face cx={110} cy={108} spread={14} size={5} />
            {outfit}
          </g>
        </>
      );

    case "B2":
      // Growing tree — bigger canopy, a fourth lobe, taller trunk.
      return (
        <>
          <ellipse cx="110" cy="216" rx="88" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 208 C110 172 108 152 108 128" stroke="#8A6B4A" strokeWidth="15" strokeLinecap="round" />
            <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill="#8A6B4A" />
            <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill="#8A6B4A" />
            <circle cx="110" cy="98" r="54" fill="#6BBF8A" />
            <circle cx="66" cy="118" r="28" fill="#7FCB99" />
            <circle cx="154" cy="118" r="28" fill="#7FCB99" />
            <circle cx="110" cy="60" r="30" fill="#5AB07E" />
            <circle cx="80" cy="70" r="20" fill="#5AB07E" opacity=".85" />
            <Face cx={110} cy={100} spread={16} size={5.6} />
            {outfit}
          </g>
        </>
      );

    case "C1":
      // Blossoming tree — same canopy, dotted with blossoms.
      return (
        <>
          <ellipse cx="110" cy="216" rx="88" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 208 C110 172 108 152 108 128" stroke="#8A6B4A" strokeWidth="15" strokeLinecap="round" />
            <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill="#8A6B4A" />
            <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill="#8A6B4A" />
            <circle cx="110" cy="98" r="54" fill="#6BBF8A" />
            <circle cx="66" cy="118" r="28" fill="#7FCB99" />
            <circle cx="154" cy="118" r="28" fill="#7FCB99" />
            <circle cx="110" cy="60" r="30" fill="#5AB07E" />
            {[
              [78, 66], [140, 58], [60, 108], [160, 104], [96, 44], [126, 130],
            ].map(([bx, by], i) => (
              <circle key={i} cx={bx} cy={by} r={5} fill={i % 2 ? "#F2A0B9" : "#FFD6E5"} />
            ))}
            <Face cx={110} cy={100} spread={16} size={5.6} />
            {outfit}
          </g>
        </>
      );

    case "C2":
      // Fruit tree — the full harvest.
      return (
        <>
          <ellipse cx="110" cy="216" rx="88" ry="14" fill="#E2D5B8" />
          <g className="sway">
            <path d="M110 208 C110 172 108 152 108 128" stroke="#8A6B4A" strokeWidth="15" strokeLinecap="round" />
            <path d="M108 160 C88 154 76 140 74 124 C92 128 103 142 108 156Z" fill="#8A6B4A" />
            <path d="M108 176 C130 172 144 158 146 142 C126 146 114 160 108 172Z" fill="#8A6B4A" />
            <circle cx="110" cy="98" r="54" fill="#6BBF8A" />
            <circle cx="66" cy="118" r="28" fill="#7FCB99" />
            <circle cx="154" cy="118" r="28" fill="#7FCB99" />
            <circle cx="110" cy="60" r="30" fill="#5AB07E" />
            {[
              [76, 70], [144, 64], [58, 112], [162, 110], [100, 42], [122, 134],
            ].map(([fx, fy], i) => (
              <g key={i}>
                <path d={`M${fx} ${fy - 8} L${fx} ${fy - 4}`} stroke="#4E9A6D" strokeWidth="2" strokeLinecap="round" />
                <circle cx={fx} cy={fy} r={7} fill="#FF6B5B" />
                <circle cx={fx - 2} cy={fy - 2} r={2} fill="#FF9E7D" />
              </g>
            ))}
            <Face cx={110} cy={100} spread={16} size={5.6} />
            {outfit}
          </g>
        </>
      );
  }
}
