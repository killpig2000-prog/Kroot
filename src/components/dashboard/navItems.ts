// Single source of truth for app navigation — the desktop Sidebar and the
// mobile Menu sheet (BottomNav) both render from these lists.

export type NavColor = { text: string; bg: string; border: string };

export type NavItem = {
  icon: string;
  label: string;
  href: string;
  /** Icon-badge tint — matches each section's own page header accent. */
  color?: NavColor;
  /** Rainbow-ring + "Popular" badge treatment. */
  popular?: boolean;
  /** Small "New" pill next to the label. */
  isNew?: boolean;
};

// "My growth" merged into the Garden (2026-08): grass, costume, and progress
// now live on /dashboard; /profile is account settings, reached via AccountMenu.
export const MAIN_ITEMS: NavItem[] = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
];

export const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Basics",
    items: [
      { icon: "🧭", label: "Guide", href: "/guide", color: { text: "#0284C7", bg: "#F0F9FF", border: "#BAE6FD" } },
      { icon: "🔤", label: "Hangul", href: "/hangul", color: { text: "#E11D48", bg: "#FFF1F2", border: "#FECDD3" } },
      { icon: "📖", label: "Grammar", href: "/grammar", color: { text: "#4F46E5", bg: "#EEF2FF", border: "#C7D2FE" } },
      { icon: "🃏", label: "Vocabulary", href: "/vocabulary", color: { text: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" }, popular: true },
    ],
  },
  {
    title: "Practice",
    items: [
      { icon: "🎧", label: "Listening", href: "/listening", color: { text: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" } },
      { icon: "🌶️", label: "Pronunciation", href: "/speaking", color: { text: "#0D9488", bg: "#F0FDFA", border: "#99F6E4" }, popular: true },
      { icon: "✏️", label: "Writing", href: "/writing", color: { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" } },
      { icon: "📰", label: "Reading", href: "/reading", color: { text: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" } },
    ],
  },
  {
    title: "Relax",
    items: [
      { icon: "💬", label: "Slang", href: "/slang", color: { text: "#DB2777", bg: "#FDF2F8", border: "#FBCFE8" } },
      { icon: "🛍️", label: "Shop", href: "/shop", color: { text: "#C2410C", bg: "#FFF7ED", border: "#FED7AA" } },
    ],
  },
];
