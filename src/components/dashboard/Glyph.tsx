// The Garden's small glyphs — the streak, the coins, the watering can's drop,
// the day's slang bubble, the sprout on the growth tab — drawn the same way
// the six doors are (see ModuleIcon): one stroke width, one cap style,
// currentColor. They were emoji until 2026-09-08, which meant five different
// hands on one screen: 🔥 and 🪙 arrive full-colour from the system font, 💧
// is a flat blue, and none of them sit on the same baseline as the drawn door
// icons a row below. currentColor also lets them take the palette's green
// (the palette pass turned amber into green in light mode), instead of
// dragging orange and blue back onto a page that has neither.
//
// Sizing is the caller's: pass a Tailwind size class, e.g. `w-[15px] h-[15px]`.

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// A flame with its hotter core — the streak.
const Flame = (
  <>
    <path d="M12 3.4c3.1 3.3 5 5.6 5 8.3a5 5 0 0 1-10 0c0-1.6.6-3.1 1.8-4.5.4 1.3 1.1 2 1.9 2 .9 0 1.3-.8 1.3-2.2z" />
    <path d="M12 20.2a2.6 2.6 0 0 0 2.6-2.6c0-1.2-.9-2.3-2.6-4.1-1.7 1.8-2.6 2.9-2.6 4.1a2.6 2.6 0 0 0 2.6 2.6z" />
  </>
);

// A 엽전 — the old Korean coin, round with a square hole. A ₩ on the face
// was the first try and turned to mush at 14px, which is the only size this
// is ever drawn at; the square hole survives.
const Coin = (
  <>
    <circle cx="12" cy="12" r="7.9" />
    <rect x="9.4" y="9.4" width="5.2" height="5.2" rx="0.5" />
  </>
);

// A drop — review is watering what's already planted.
const Drop = <path d="M12 4.1c3.2 3.7 5 6.2 5 8.4a5 5 0 0 1-10 0c0-2.2 1.8-4.7 5-8.4z" />;

// A speech bubble — the day's one bite of spoken Korean.
const Bubble = (
  <path d="M12 4.8c-4.4 0-8 2.6-8 5.9 0 1.9 1.2 3.6 3 4.7l-.8 3.6 4-2.2c.6.1 1.2.1 1.8.1 4.4 0 8-2.6 8-5.9s-3.6-6.2-8-6.2z" />
);

// A sprout — the growth stages behind the tab.
const Sprout = (
  <>
    <path d="M12 20.4v-6.6" />
    <path d="M12 13.8c0-2.6-2-4.6-4.6-4.6 0 2.6 2 4.6 4.6 4.6z" />
    <path d="M12 13.8c0-3 2.3-5.3 5.3-5.3 0 3-2.3 5.3-5.3 5.3z" />
  </>
);

const GLYPHS = { flame: Flame, coin: Coin, drop: Drop, bubble: Bubble, sprout: Sprout };

export type GlyphName = keyof typeof GLYPHS;

export default function Glyph({ name, className = "w-[15px] h-[15px]" }: { name: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`inline-block flex-none ${className}`} aria-hidden="true" focusable="false">
      <g {...STROKE}>{GLYPHS[name]}</g>
    </svg>
  );
}
