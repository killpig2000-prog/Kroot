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
  /** data-tour id — spotlit by the post-tour guided walkthrough. */
  tourId?: string;
};

// The Garden is "what do I do today"; My account is "how far have I come" —
// learning progress, accuracy and account settings. Both are top-level so the
// stats page is reachable without opening the account menu.
export const MAIN_ITEMS: NavItem[] = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
  { icon: "📈", label: "My progress", href: "/profile" },
  { icon: "📚", label: "My word bank", href: "/review/words", color: { text: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" } },
];

// Personal destinations sit unlabelled at the top; the three learning
// sections below are the app's original grouping. The word bank lives with
// Garden and My progress because it's the learner's own list, not a lesson.
export const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Basics",
    items: [
      { icon: "🧭", label: "Guide", href: "/guide", color: { text: "#1F81B4", bg: "#F0F9FF", border: "#BAE6FD" } },
      { icon: "🔤", label: "Hangul", href: "/hangul", color: { text: "#C63958", bg: "#FFF1F2", border: "#FECDD3" }, tourId: "guided-nav-hangul" },
      { icon: "📖", label: "Grammar", href: "/grammar", color: { text: "#423AC5", bg: "#EEF2FF", border: "#C7D2FE" } },
      { icon: "🃏", label: "Vocabulary", href: "/vocabulary", color: { text: "#6B33CC", bg: "#F5F3FF", border: "#DDD6FE" }, popular: true, tourId: "guided-nav-vocabulary" },
    ],
  },
  {
    title: "Practice",
    items: [
      { icon: "🎧", label: "Listening", href: "/listening", color: { text: "#2C9754", bg: "#F0FDF4", border: "#BBF7D0" } },
      { icon: "🌶️", label: "Pronunciation", href: "/speaking", color: { text: "#228980", bg: "#F0FDFA", border: "#99F6E4" }, popular: true },
      { icon: "✏️", label: "Writing", href: "/writing", color: { text: "#C47A25", bg: "#FFFBEB", border: "#FDE68A" }, tourId: "guided-nav-writing" },
      { icon: "📰", label: "Reading", href: "/reading", color: { text: "#3363CC", bg: "#EFF6FF", border: "#BFDBFE" } },
    ],
  },
  {
    title: "Relax",
    items: [
      { icon: "💬", label: "Slang", href: "/slang", color: { text: "#C13E78", bg: "#FDF2F8", border: "#FBCFE8" } },
      { icon: "🛍️", label: "Shop", href: "/shop", color: { text: "#B14F27", bg: "#FFF7ED", border: "#FED7AA" }, tourId: "guided-nav-shop" },
      // Weekly "garden fair" — re-enabled 2026-09-03 on top of the migration
      // 0026 league objects (see league-paused → ranking-garden-fair memory).
      { icon: "🏅", label: "Ranking", href: "/ranking", color: { text: "#C47A25", bg: "#FFFBEB", border: "#FDE68A" }, isNew: true },
    ],
  },
];
