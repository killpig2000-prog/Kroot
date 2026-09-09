// The Garden doors' icons — and, since 2026-09-10, the five nav tabs' —
// drawn instead of typed. Emoji were the one
// thing on the phone home we couldn't control: 🃏 renders as a star on some
// Androids, 🌶️ arrives full-colour next to a flat grey 📰, and none of them
// share a weight — six icons that never read as one set. These are one
// stroke width, one cap style, one colour (currentColor), so the grid finally
// looks drawn by one hand.
//
// Everywhere, not just the phone: the desktop grid kept emoji for one pass
// and the user asked for the drawn set there too (839b57c). navItems' `icon`
// stays for the sidebar's own list and anywhere else that reads it.
//
// 2026-09-10: the phone tab bar joined them. Five emoji sat directly under
// a grid of drawn icons — 🏡 and 🌳 arrive full-colour, ⚙️ is grey, and none
// of them take the active tab's green — so the bar read as a different app
// than the page above it. Same stroke, same box, currentColor.

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};


// A sheet of paper with 가 on it — the letters before the words.
const Hangul = (
  <>
    <rect x="3.4" y="4.2" width="17.2" height="15.6" rx="3.2" />
    <path d="M7.6 8.9h3.9v6.4" />
    <path d="M15.6 8.2v7.8M15.6 12.4h2.6" />
  </>
);

// Two word cards, the front one carrying its meaning line.
const Vocabulary = (
  <>
    <rect x="7.2" y="4.3" width="12.6" height="11.4" rx="2.6" />
    <rect x="4.2" y="8.3" width="12.6" height="11.4" rx="2.6" />
    <path d="M7.4 13.2h6.2M7.4 16h4" />
  </>
);

// A pencil on its line.
const Writing = (
  <>
    <path d="M5.2 17.4 4.5 20l2.6-.7 9.9-9.9a1.85 1.85 0 0 0-2.6-2.6z" />
    <path d="M13.6 8.2l2.6 2.6" />
    <path d="M4.4 21.4h15.2" />
  </>
);

// An open book, both leaves.
const Reading = (
  <>
    <path d="M12 7.6c-1.9-1.5-4.1-2.1-6.6-1.9v10.7c2.5-.2 4.7.4 6.6 1.9 1.9-1.5 4.1-2.1 6.6-1.9V5.7c-2.5-.2-4.7.4-6.6 1.9z" />
    <path d="M12 7.6v10.7" />
  </>
);

// Headphones — the band and two cups.
const Listening = (
  <>
    <path d="M4.8 15.4v-2.6a7.2 7.2 0 0 1 14.4 0v2.6" />
    <rect x="3.2" y="13.6" width="3.4" height="5.6" rx="1.7" />
    <rect x="17.4" y="13.6" width="3.4" height="5.6" rx="1.7" />
  </>
);

// A spoken bubble with the sound leaving it.
const Pronunciation = (
  <>
    <path d="M12.6 4.8H5.8A2.2 2.2 0 0 0 3.6 7v4.6a2.2 2.2 0 0 0 2.2 2.2H6v2.9l3.5-2.9h3.1a2.2 2.2 0 0 0 2.2-2.2V7a2.2 2.2 0 0 0-2.2-2.2z" />
    <path d="M17.4 8.4a3.6 3.6 0 0 1 0 5.2" />
    <path d="M19.9 6.2a6.8 6.8 0 0 1 0 9.6" />
  </>
);

// A tree on its patch of ground — the Garden itself. The crown was an open
// arc for one pass and read as a magnifying glass at 20px; it closes now.
const Garden = (
  <>
    <circle cx="12" cy="8.6" r="5.2" />
    <path d="M12 13.8v6.6" />
    <path d="M9.2 20.4h5.6" />
  </>
);

// A line climbing three steps — progress, not a chart's axes.
const Progress = (
  <>
    <path d="M4 19.4h16" />
    <path d="M4.6 15.8 9.4 11l3.3 3.3 6-6.4" />
    <path d="M14.6 7.9h4.3v4.2" />
  </>
);

// A drop — the same one the dashboard's "words are due" row uses (Glyph's
// drop): review is watering what's already planted. A card with a circular
// arrow was the first try and read as a reload badge at 20px.
const Review = <path d="M12 4.1c3.2 3.7 5 6.2 5 8.4a5 5 0 0 1-10 0c0-2.2 1.8-4.7 5-8.4z" />;

// A door with its knob, standing on the floor line — the room's way in. A
// door drawn ajar in perspective was the first try; the flap turned to mush
// at 20px, so this one faces you square.
const MyRoom = (
  <>
    <rect x="6.2" y="3.4" width="11.6" height="16.8" rx="2.4" />
    <circle cx="14.9" cy="12" r="0.95" />
    <path d="M4.2 20.4h15.6" />
  </>
);

// Two sliders — a gear's teeth turn to porridge at 20px.
const Settings = (
  <>
    <path d="M4.2 8.6h15.6M4.2 15.4h15.6" />
    <circle cx="9.4" cy="8.6" r="2.3" />
    <circle cx="15" cy="15.4" r="2.3" />
  </>
);

const ICONS: Record<string, React.ReactNode> = {
  "/dashboard": Garden,
  "/profile": Progress,
  "/review/words": Review,
  "/myroom": MyRoom,
  "/settings": Settings,
  "/hangul": Hangul,
  "/vocabulary": Vocabulary,
  "/writing": Writing,
  "/reading": Reading,
  "/listening": Listening,
  "/speaking": Pronunciation,
};

/** `size` is the drawn box in px — 26 on the doors, 22 in the quest pill. */
export default function ModuleIcon({ href, size = 26 }: { href: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className="flex-none"
      aria-hidden="true"
      focusable="false"
    >
      <g {...STROKE}>{ICONS[href] ?? Vocabulary}</g>
    </svg>
  );
}
