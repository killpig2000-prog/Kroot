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
// 2026-09-10: the Settings page's rows joined them. Thirteen emoji sat in
// thirteen identical bordered boxes — 🔑 and 🚪 arrive full-colour, ⚠️ is
// red whatever the row's mood, ☀️/🍁 drag orange onto a page that has none,
// and 📱 renders as a different phone on every platform. Drawn, they take
// the row's own colour (the delete row's icon can finally go red with its
// label) and sit on one baseline.
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


// --- Settings rows ------------------------------------------------------

// A key, bow to the left — change your password.
const Key = (
  <>
    <circle cx="8" cy="12" r="4.2" />
    <path d="M12.2 12h7.6" />
    <path d="M17.2 12v3M19.8 12v2.2" />
  </>
);

// A door with a way out of it — sign out.
const Door = (
  <>
    <path d="M12.6 20.4H6.4a1.4 1.4 0 0 1-1.4-1.4V5a1.4 1.4 0 0 1 1.4-1.4h6.2" />
    <path d="M16.6 15.6 20.2 12l-3.6-3.6" />
    <path d="M19.8 12h-9.4" />
  </>
);

// A triangle with a bang — the one row you can't undo.
const Warning = (
  <>
    <path d="M12 4.2 21.2 19.8H2.8z" />
    <path d="M12 10.2v3.9" />
    <path d="M12 16.9v.05" />
  </>
);

// A globe, meridian and equator — the interface language.
const Globe = (
  <>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M3.8 12h16.4" />
    <path d="M12 3.8c2.1 2.3 3.2 5 3.2 8.2s-1.1 5.9-3.2 8.2c-2.1-2.3-3.2-5-3.2-8.2s1.1-5.9 3.2-8.2z" />
  </>
);

// A mortarboard — your level, and the test past it.
const Cap = (
  <>
    <path d="M12 4.4 21.4 8.8 12 13.2 2.6 8.8z" />
    <path d="M6.8 10.8v4.8c0 1.5 2.3 2.7 5.2 2.7s5.2-1.2 5.2-2.7v-4.8" />
  </>
);

// A phone — the push notification's home.
const Phone = (
  <>
    <rect x="6.9" y="2.8" width="10.2" height="18.4" rx="2.4" />
    <path d="M10.6 18.4h2.8" />
  </>
);

// An envelope — the email reminder.
const Mail = (
  <>
    <rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.4" />
    <path d="M4.6 7.4 12 12.8l7.4-5.4" />
  </>
);

// A bell — the chimes.
const Bell = (
  <>
    <path d="M17.4 16.4H6.6c1.1-1.2 1.7-2.5 1.7-3.8v-2.2a3.7 3.7 0 0 1 7.4 0v2.2c0 1.3.6 2.6 1.7 3.8z" />
    <path d="M10.3 19a1.9 1.9 0 0 0 3.4 0" />
  </>
);

// A crescent — dark mode.
const Moon = <path d="M20 14.3A8.4 8.4 0 0 1 9.7 4 8.4 8.4 0 1 0 20 14.3z" />;

// A sun and its rays — light mode.
const Sun = (
  <>
    <circle cx="12" cy="12" r="4.1" />
    <path d="M12 3.2v2.2M12 18.6v2.2M3.2 12h2.2M18.6 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6" />
  </>
);

// A leaf on its stem — the seasonal theme, whichever season is on. The row
// names the season in words; four different drawn leaves would be four
// icons for one switch.
const Leaf = (
  <>
    <path d="M5.6 18.4C4 12.2 8.2 5.4 19.2 4.6c.8 9.6-5.1 14.6-11.5 14.2" />
    <path d="M4.4 19.6 11.2 12.8" />
  </>
);

// A pencil — the button that lets you rename yourself.
const Pencil = (
  <>
    <path d="M5.6 16.8 4.9 19.4l2.6-.7 9.6-9.6a1.8 1.8 0 0 0-2.5-2.5z" />
    <path d="M13.6 7.8l2.5 2.5" />
  </>
);

// A page with its corner turned — the privacy policy.
const Doc = (
  <>
    <path d="M13.4 3.6H7.6a2 2 0 0 0-2 2v12.8a2 2 0 0 0 2 2h8.8a2 2 0 0 0 2-2V8.6z" />
    <path d="M13.4 3.6v5h5" />
    <path d="M8.8 13.2h6.4M8.8 16.2h4.4" />
  </>
);

const GLYPHS = {
  flame: Flame, coin: Coin, drop: Drop, bubble: Bubble, sprout: Sprout,
  key: Key, door: Door, warning: Warning, globe: Globe, cap: Cap,
  phone: Phone, mail: Mail, bell: Bell, moon: Moon, sun: Sun, leaf: Leaf,
  doc: Doc, pencil: Pencil,
};

export type GlyphName = keyof typeof GLYPHS;

export default function Glyph({ name, className = "w-[15px] h-[15px]" }: { name: GlyphName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`inline-block flex-none ${className}`} aria-hidden="true" focusable="false">
      <g {...STROKE}>{GLYPHS[name]}</g>
    </svg>
  );
}
