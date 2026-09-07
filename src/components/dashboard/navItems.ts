// Single source of truth for app navigation — the desktop Sidebar and the
// mobile BottomNav both render from these lists.
//
// 2026-09-07 restructure (step 1 of the "My Room" plan, see memory
// myroom-restructure-mockup-2026-09-07): three flat top-level destinations
// instead of Garden/My progress/My word bank + three category sheets.
// - Garden (/dashboard) is now also home to the module grid (MODULES below).
// - Learn (/profile) is the analysis page, unchanged.
// - My room (/myroom, new) absorbs Shop, Ranking and My word bank — the
//   learner's own things and settings, not lessons.

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
  /** data-tour id — spotlit by the onboarding tour and/or guided walkthrough. */
  tourId?: string;
};

// The three flat destinations — same set on the phone BottomNav and the
// desktop Sidebar. "Garden" also carries tourId "guided-nav-home": once
// Shop moved off the sidebar (into My room), the guided tour's
// "there's more to explore" step (practice-more) points back at this
// always-present tab instead of a section that no longer exists.
export const MAIN_ITEMS: NavItem[] = [
  { icon: "🏡", label: "Garden", href: "/dashboard", tourId: "guided-nav-home" },
  { icon: "📊", label: "Learn", href: "/profile" },
  { icon: "🌳", label: "My room", href: "/myroom" },
];

// The six lesson modules — rendered as a 2×3 grid on the Garden page
// itself (no category sheet hides them). Content 8→6 per the restructure
// ledger: Guide is gone; Hangul lives inside the vocabulary card (trace-to-
// write); Grammar lives inside writing (particle blanks with a "why").
export const MODULES: NavItem[] = [
  { icon: "🃏", label: "Vocabulary", href: "/vocabulary", popular: true, tourId: "guided-nav-vocabulary" },
  { icon: "✏️", label: "Writing", href: "/writing", tourId: "guided-nav-writing" },
  { icon: "📰", label: "Reading", href: "/reading" },
  { icon: "🎧", label: "Listening", href: "/listening" },
  { icon: "🌶️", label: "Pronunciation", href: "/speaking" },
  { icon: "💬", label: "Slang", href: "/slang" },
];

// My room's own list — the learner's things, not lessons. Shop carries
// tourId "guided-nav-shop" for the dashboard-only case (nothing else needs
// it here); the guided tour's two other shop-nav steps, reached from
// /hangul and mid-writing, use their own contextual links on those pages
// instead, since My room isn't a page those flows pass through.
export const MY_ROOM_ITEMS: NavItem[] = [
  { icon: "🛍️", label: "Shop", href: "/shop", color: { text: "#B14F27", bg: "#FFF7ED", border: "#FED7AA" } },
  { icon: "🏅", label: "Ranking", href: "/ranking", color: { text: "#C47A25", bg: "#FFFBEB", border: "#FDE68A" } },
  { icon: "📚", label: "My word bank", href: "/review/words", color: { text: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" } },
];
