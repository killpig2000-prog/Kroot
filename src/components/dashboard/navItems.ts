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
  /** nav.json key. Absent = derived from the label (see navKey). */
  i18nKey?: string;
  /** nav.json key for the phone tab bar, where a label gets ~72px at 360px.
   *  Absent = i18nKey/label. */
  shortKey?: string;
};

// The five flat destinations — same set on the phone BottomNav and the
// desktop Sidebar. 2026-09-10, user call: the three-tab set hid two things
// the learner needs often. Review was two taps deep inside My room, and
// Settings (built 2026-09-09) was reachable only from the avatar menu and a
// My room row, so on desktop it was effectively invisible.
//
// "Learn" is now "My progress": the label used to collide with the LEARN
// section header above the six modules in the sidebar — same word, two
// different destinations.
//
// "Garden" also carries tourId "guided-nav-home": once Shop moved off the
// sidebar (into My room), the guided tour's "there's more to explore" step
// (practice-more) points back at this always-present tab instead of a
// section that no longer exists.
export const MAIN_ITEMS: NavItem[] = [
  { icon: "🏡", label: "Garden", href: "/dashboard", tourId: "guided-nav-home" },
  { icon: "📊", label: "My progress", href: "/profile", i18nKey: "myProgress", shortKey: "progressShort" },
  // My room sits third (2026-09-11, user call): the learner's own things
  // are the tab they open after a lesson; Review is the one they open when
  // words are due, which the Garden row already points at.
  { icon: "🌳", label: "My room", href: "/myroom", i18nKey: "myRoom", shortKey: "myRoomShort" },
  { icon: "📒", label: "Review", href: "/review/words" },
  { icon: "⚙️", label: "Settings", href: "/settings" },
];

// The six lesson modules — rendered as a 2×3 grid on the Garden page
// itself (no category sheet hides them). Content 8→6 per the restructure
// ledger: Guide is gone; Grammar lives inside writing (particle blanks with
// a "why"); Slang moved to a row at the top of /vocabulary.
//
// Hangul leads the grid: it was folded into the vocabulary card for one
// pass and the user couldn't find it, so it's a door of its own again —
// and first, since the letters come before the words. Its in-card
// trace-to-write (WordTrace) stays where it is.
export const MODULES: NavItem[] = [
  { icon: "🔤", label: "Hangul", href: "/hangul", tourId: "guided-nav-hangul" },
  { icon: "🃏", label: "Vocabulary", href: "/vocabulary", popular: true, tourId: "guided-nav-vocabulary" },
  { icon: "✏️", label: "Writing", href: "/writing", tourId: "guided-nav-writing" },
  { icon: "📰", label: "Reading", href: "/reading" },
  { icon: "🎧", label: "Listening", href: "/listening" },
  { icon: "🌶️", label: "Pronunciation", href: "/speaking" },
];

// My room's own list — the learner's things, not lessons. The word bank
// left this list on 2026-09-10: it became the top-level "Review" tab, and a
// sidebar column linking the same page twice reads like a mistake. The
// /myroom page keeps its own row for it. Shop carries
// tourId "guided-nav-shop" for the dashboard-only case (nothing else needs
// it here); the guided tour's two other shop-nav steps, reached from
// /hangul and mid-writing, use their own contextual links on those pages
// instead, since My room isn't a page those flows pass through.
export const MY_ROOM_ITEMS: NavItem[] = [
  { icon: "🛍️", label: "Shop", href: "/shop", color: { text: "#B14F27", bg: "#FFF7ED", border: "#FED7AA" } },
  { icon: "🏅", label: "Ranking", href: "/ranking", color: { text: "#C47A25", bg: "#FFFBEB", border: "#FDE68A" } },
];
