import BottomNav from "@/components/dashboard/BottomNav";

// Route-level loading state: the page's chrome (sidebar rail on xl, the
// 52px top band under it) and one small tree growing out of the ground in
// the middle. It replaces the grey-block skeletons every route carried
// until 2026-09-11 — twenty-three files, each mirroring one page's layout.
// The user's call: a garden app should not flash a page of grey lego for
// half a second; one drawn thing growing says "loading" in the app's own
// hand. Nothing is written on it (zero-nudge rule, and the wait is 0.3–0.7s
// on a tab tap, too short to read anyway).
//
// The tree sprouts once (0.55s, a hair of overshoot), then sways. It never
// restarts, so a long wait doesn't jitter. prefers-reduced-motion gets the
// grown tree, still. Sized with clamp so 360px and 430px both get a tree
// that reads as a picture, not an icon (AGENTS.md rule 2).
//
// The phone tab bar is part of the chrome too: it is mounted per page, so
// without it here a tab tap made the bar vanish for the whole wait and pop
// back with the page. Rendered here it stays put and the tapped tab turns
// green at once (usePathname already points at the destination).
//
// `plain` is for pages without the dashboard sidebar or tab bar (admin,
// onboarding): same tree, no rail, band or tabs.
export default function TreeLoading({ plain = false }: { plain?: boolean }) {
  const tree = (
    <div className="flex items-center justify-center min-h-[62svh]" role="status" aria-busy="true">
      <span className="sr-only">Loading</span>
      <svg
        viewBox="0 0 96 96"
        className="tree-loading text-success-deep w-[clamp(84px,22vw,108px)] h-[clamp(84px,22vw,108px)]"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* the ground: a low hill the trunk stands on */}
        <path className="tree-ground" d="M14 80 Q48 70 82 80" stroke="var(--c-success)" />
        <g className="tree-sway">
          <g className="tree-trunk">
            <path d="M48 78 V44" />
            {/* two leaves, drawn the way the sprout glyph is */}
            <path className="tree-leaf tree-leaf-l" d="M48 52 C48 42 41 35 31 35 C31 45 38 52 48 52 Z" />
            <path className="tree-leaf tree-leaf-r" d="M48 44 C48 32 56 24 68 24 C68 36 60 44 48 44 Z" />
            {/* the crown: a round canopy that fills in last */}
            <circle className="tree-crown" cx="48" cy="30" r="13" fill="var(--c-success)" stroke="none" opacity="0.55" />
          </g>
        </g>
      </svg>
    </div>
  );

  if (plain) {
    return <div className="min-h-screen bg-warm px-6">{tree}</div>;
  }
  return (
    <div className="min-h-screen bg-warm">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <div className="hidden xl:block border-r border-dashed border-dash bg-warm" />
        <div className="xl:hidden h-[52px] border-b-[1.5px] border-dashed border-dash bg-warm" />
        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pb-[100px] xl:pb-[60px]">{tree}</main>
      </div>
      <BottomNav />
    </div>
  );
}
