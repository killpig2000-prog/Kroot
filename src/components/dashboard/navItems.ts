// Single source of truth for app navigation — the desktop Sidebar and the
// mobile Menu sheet (BottomNav) both render from these lists.

export type NavItem = { icon: string; label: string; href: string };

// "My growth" merged into the Garden (2026-08): grass, costume, and progress
// now live on /dashboard; /profile is account settings, reached via AccountMenu.
export const MAIN_ITEMS: NavItem[] = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
];

export const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Basics",
    items: [
      { icon: "🧭", label: "16-Day Course", href: "/course" },
      { icon: "🔤", label: "Hangul", href: "/hangul" },
      { icon: "📖", label: "Grammar", href: "/grammar" },
      { icon: "🃏", label: "Vocabulary", href: "/vocabulary" },
    ],
  },
  {
    title: "Practice",
    items: [
      { icon: "🎧", label: "Listening", href: "/listening" },
      { icon: "🎙️", label: "Speaking", href: "/speaking" },
      { icon: "✏️", label: "Writing", href: "/writing" },
      { icon: "📰", label: "Reading", href: "/reading" },
    ],
  },
  {
    title: "Relax",
    items: [
      { icon: "🏆", label: "League", href: "/league" },
      { icon: "💬", label: "Slang", href: "/slang" },
      { icon: "🛍️", label: "Shop", href: "/shop" },
    ],
  },
];
