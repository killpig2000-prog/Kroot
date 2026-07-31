const PALETTE = ["#6BBF8A", "#FF9E7D", "#8FCBDF", "#FFD66B", "#B7A6E3", "#F2A0B9"];
const SKIN = "#FFE3C2";

export function characterColor(index: number) {
  return PALETTE[index % PALETTE.length];
}

export type CharacterVariant = "a" | "b";

export function characterVariant(index: number): CharacterVariant {
  return index % 2 === 0 ? "a" : "b";
}

// Chibi-style characters in the app's rounded illustration language.
// Variant "a" is a girl (bob hair + bow), "b" is a boy (short fringe).
export default function Character({
  color,
  variant,
  talking,
  idle = false,
  size = 96,
}: {
  color: string;
  variant: CharacterVariant;
  talking: boolean;
  idle?: boolean;
  size?: number;
}) {
  const hair = variant === "a" ? "#C98A4B" : "#3E3226";
  const idleClass = idle ? (variant === "a" ? "char-stroll" : "char-tumble") : "";

  return (
    <svg
      width={size}
      height={size * 1.18}
      viewBox="0 0 100 118"
      className={talking ? "animate-bounce" : idleClass}
      style={{ filter: "drop-shadow(0 4px 0 rgba(0,0,0,.12))" }}
    >
      <ellipse cx="50" cy="112" rx="24" ry="5" fill="rgba(0,0,0,.08)" />

      {/* body */}
      <path d="M50 68c16 0 25 9 25 28v12a4 4 0 0 1-4 4H29a4 4 0 0 1-4-4V96c0-19 9-28 25-28Z" fill={color} />
      {/* collar */}
      <path d="M42 70q8 7 16 0l-4 8h-8Z" fill="#fff" opacity=".85" />
      {/* arms */}
      <circle cx="23" cy="92" r="7.5" fill={color} />
      <circle cx="77" cy="92" r="7.5" fill={color} />

      {variant === "a" ? (
        <>
          {/* girl: bob hair behind the face */}
          <path d="M18 46c0-21 14-34 32-34s32 13 32 34c0 13-5 22-10 24l-3-16H31l-3 16c-5-2-10-11-10-24Z" fill={hair} />
          {/* face */}
          <circle cx="50" cy="46" r="26" fill={SKIN} />
          {/* fringe */}
          <path d="M25 42c1-14 11-24 25-24s24 10 25 24c-5-8-10-11-13-10 2 2 2 4 1 6-4-5-9-8-13-8s-9 3-13 8c-1-2-1-4 1-6-3-1-8 2-13 10Z" fill={hair} />
          {/* bow */}
          <g transform="translate(72,20) rotate(18)">
            <circle cx="0" cy="0" r="3.4" fill="#FF9E7D" />
            <path d="M-3 0l-9-5v10Z" fill="#FF9E7D" />
            <path d="M3 0l9-5v10Z" fill="#FF9E7D" />
          </g>
        </>
      ) : (
        <>
          {/* face */}
          <circle cx="50" cy="46" r="26" fill={SKIN} />
          {/* boy: short tufty fringe */}
          <path d="M24 44c0-15 11-26 26-26s26 11 26 26c-3-7-7-10-10-10 1-3 0-5-2-6-2 3-5 5-8 5 1-2 1-4 0-6-3 3-7 5-11 5-3 0-6-1-8-3-1 2-1 5 0 7-4-1-9 2-13 8Z" fill={hair} />
        </>
      )}

      {/* eyes with highlights */}
      <circle cx="40" cy="48" r="4.2" fill="#3E3226" />
      <circle cx="60" cy="48" r="4.2" fill="#3E3226" />
      <circle cx="41.5" cy="46.5" r="1.4" fill="#fff" />
      <circle cx="61.5" cy="46.5" r="1.4" fill="#fff" />
      {/* blush */}
      <ellipse cx="31" cy="56" rx="4.5" ry="3" fill="#FF9E7D" opacity=".45" />
      <ellipse cx="69" cy="56" rx="4.5" ry="3" fill="#FF9E7D" opacity=".45" />
      {/* mouth */}
      {talking ? (
        <>
          <ellipse cx="50" cy="61" rx="6" ry="5.2" fill="#7A4A3A" />
          <ellipse cx="50" cy="63" rx="3.6" ry="2.2" fill="#FF9E7D" />
        </>
      ) : (
        <path d="M43 59q7 6 14 0" stroke="#7A4A3A" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}
