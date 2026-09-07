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

// The eight lesson modules — rendered as a grid on the Garden page itself
// (there's no more category sheet to hide them behind). Guide was dropped
// per the restructure ledger (content 8→6 plan): it had no dependency on
// the later content-merge steps, so it's gone now rather than staged.
// Hangul and Grammar are here on borrowed time — steps 3/4 of the plan fold
// them into Vocabulary/Writing, at which point these two entries retire.
export const MODULES: NavItem[] = [
  { icon: "🔤", label: "Hangul", href: "/hangul", color: { text: "#C63958", bg: "#FFF1F2", border: "#FECDD3" }, tourId: "guided-nav-hangul" },
  { icon: "🃏", label: "Vocabulary", href: "/vocabulary", color: { text: "#6B33CC", bg: "#F5F3FF", border: "#DDD6FE" }, popular: true, tourId: "guided-nav-vocabulary" },
  { icon: "✏️", label: "Writing", href: "/writing", color: { text: "#C47A25", bg: "#FFFBEB", border: "#FDE68A" }, tourId: "guided-nav-writing" },
  { icon: "📰", label: "Reading", href: "/reading", color: { text: "#3363CC", bg: "#EFF6FF", border: "#BFDBFE" } },
  { icon: "🎧", label: "Listening", href: "/listening", color: { text: "#2C9754", bg: "#F0FDF4", border: "#BBF7D0" } },
  { icon: "🌶️", label: "Pronunciation", href: "/speaking", color: { text: "#228980", bg: "#F0FDFA", border: "#99F6E4" }, popular: true },
  { icon: "📖", label: "Grammar", href: "/grammar", color: { text: "#423AC5", bg: "#EEF2FF", border: "#C7D2FE" } },
  { icon: "💬", label: "Slang", href: "/slang", color: { text: "#C13E78", bg: "#FDF2F8", border: "#FBCFE8" } },
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
