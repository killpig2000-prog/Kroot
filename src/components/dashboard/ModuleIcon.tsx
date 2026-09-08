// The six Garden doors' icons, drawn instead of typed. Emoji were the one
// thing on the phone home we couldn't control: 🃏 renders as a star on some
// Androids, 🌶️ arrives full-colour next to a flat grey 📰, and none of them
// share a weight — six icons that never read as one set. These are one
// stroke width, one cap style, one colour (currentColor), so the grid finally
// looks drawn by one hand.
//
// Everywhere, not just the phone: the desktop grid kept emoji for one pass
// and the user asked for the drawn set there too (839b57c). navItems' `icon`
// stays for the sidebar's own list and anywhere else that reads it.

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

const ICONS: Record<string, React.ReactNode> = {
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
