"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";

// Four tabs (2026-08-28): Garden · Learn · Review · More — equal-width cells
// that fill the bar edge to edge (2026-08-29), so each tap target is a quarter
// of the screen rather than a 60px pill in the middle. Learning used to
// sit two taps deep behind a single "Menu" while the Shop had a tab of its
// own; now the first study action is one tap away and the review queue
// carries a due-count badge, which is the cheapest retention nudge we have.
type Sheet = "learn" | "more" | null;

// nav.json keys: single-word labels lowercase 1:1 ("Garden" → garden);
// multi-word ones are stored as the key itself ("My account" → myAccount).
const navKey = (label: string) =>
  label === "My progress" ? "myProgress" : label === "My word bank" ? "myWords" : /[A-Z]/.test(label.slice(1)) ? label : label.toLowerCase();

const LEARN_SECTIONS = SECTIONS.filter((s) => s.title === "Basics" || s.title === "Practice");
const MORE_SECTIONS = [
  // MAIN_ITEMS already carries Garden + My account.
  { title: "myPage", items: MAIN_ITEMS },
  ...SECTIONS.filter((s) => s.title !== "Basics" && s.title !== "Practice"),
];
const LEARN_PATHS = LEARN_SECTIONS.flatMap((s) => s.items.map((i) => i.href));


function Tile({
  icon,
  label,
  href,
  on,
  onNavigate,
  color,
  popular,
  isNew,
}: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  onNavigate: () => void;
  color?: NavColor;
  popular?: boolean;
  isNew?: boolean;
}) {
  const tn = useTranslations("nav");
  const tile = (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative flex flex-col items-center gap-1 rounded-[12px] border bg-cream px-1 py-2.5 text-center text-[11px] font-bold transition-colors ${
        on ? "border-success text-success-deep" : "border-warm-3 text-charcoal hover:border-dash"
      }`}
    >
      {popular && (
        <span className="absolute -top-1.5 -right-1.5 text-[8.5px] font-extrabold text-[#B14F27] bg-[#FDE9D0] rounded-full px-[6px] py-px">
          Popular
        </span>
      )}
      {isNew && (
        <span className="absolute -top-1.5 -right-1.5 text-[8.5px] font-extrabold text-white bg-[#9333EA] rounded-full px-[6px] py-px">
          NEW
        </span>
      )}
      {color ? (
        <span
          className="w-6 h-6 rounded-[7px] border flex items-center justify-center text-[13px]"
          style={{ background: color.bg, borderColor: color.border, color: color.text }}
        >
          {icon}
        </span>
      ) : (
        <span className="text-[17px]">{icon}</span>
      )}
      <span className="leading-tight">{tn(navKey(label))}</span>
    </Link>
  );

  return tile;
}

function TabButton({
  icon,
  label,
  on,
  onClick,
  expanded,
  badge,
}: {
  icon: string;
  label: string;
  on: boolean;
  onClick: () => void;
  expanded?: boolean;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1 text-[11.5px] transition-colors ${
        on ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
      }`}
    >
      <span className="text-[21px] leading-none" style={on ? {} : { filter: "grayscale(1)", opacity: 0.55 }}>
        {icon}
      </span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute top-1 left-[calc(50%+6px)] min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10.5px] font-bold leading-[18px] text-center tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// Both counts are things the server page usually already knows. Passing them
// in skips the client fetches entirely; leaving them out keeps the old
// self-fetching behaviour for pages that don't have them to hand.
export default function BottomNav({
  dueCount,
  streakDays: streakDaysProp,
}: {
  dueCount?: number;
  streakDays?: number | null;
} = {}) {
  const pathname = usePathname();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [fetchedStreak, setFetchedStreak] = useState<number | null>(null);
  const [fetchedDue, setFetchedDue] = useState<number>(0);
  const due = dueCount ?? fetchedDue;
  const streakDays = streakDaysProp ?? fetchedStreak;

  // Words due for review — the badge on the Review tab. Runs once per mount,
  // not per navigation: the count can't change without the user reviewing
  // something, which reloads the page that owns it anyway.
  //
  // `createClient` is imported inside the effect on purpose. @supabase/ssr
  // plus supabase-js is ~240 KB, and a top-level import put it in the initial
  // bundle of every route this nav renders on — including /privacy and
  // /offline, which never talk to Supabase at all.
  useEffect(() => {
    if (dueCount !== undefined) return;
    let cancelled = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      // getClaims() verifies the JWT locally against a cached JWKS; getUser()
      // is a ~300ms round trip to /auth/v1/user for the same id. Mirrors
      // getClaimsUser in lib/supabase/server.
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;
      if (!userId) return;
      const { count, error } = await supabase
        .from("vocabulary_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .lte("next_review_at", new Date().toISOString());
      if (!cancelled && !error) setFetchedDue(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [dueCount]);

  // The streak note is a nice-to-have; fetch it lazily the first time a
  // sheet opens and stay silent when logged out or on error.
  useEffect(() => {
    if (streakDaysProp !== undefined || !sheet || fetchedStreak !== null) return;
    let cancelled = false;
    (async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("streak_days")
        .eq("id", userId)
        .single();
      if (!cancelled && typeof data?.streak_days === "number") setFetchedStreak(data.streak_days);
    })();
    return () => {
      cancelled = true;
    };
  }, [sheet, fetchedStreak, streakDaysProp]);

  // Close when the route changes (e.g. browser back) — computed during
  // render (not an effect) so it doesn't trigger an extra render. Body
  // scroll lock while the sheet is up stays a real effect below.
  const [openForPathname, setOpenForPathname] = useState(pathname);
  if (pathname !== openForPathname) {
    setOpenForPathname(pathname);
    setSheet(null);
  }
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheet]);

  const tn = useTranslations("nav");
  const close = () => setSheet(null);
  const toggle = (s: Exclude<Sheet, null>) => setSheet((cur) => (cur === s ? null : s));
  const sections = sheet === "learn" ? LEARN_SECTIONS : sheet === "more" ? MORE_SECTIONS : [];

  const onGarden = !sheet && pathname === "/dashboard";
  const onLearn = sheet === "learn" || (!sheet && LEARN_PATHS.some((p) => pathname.startsWith(p)));
  const onReview = !sheet && pathname.startsWith("/review");
  const onMore = sheet === "more" || (!sheet && !onGarden && !onLearn && !onReview && pathname !== "/dashboard");

  return (
    <>
      {sheet && (
        <button
          aria-label="Close menu"
          onClick={close}
          className="md:hidden fixed inset-0 z-40 bg-[#282319]/35 cursor-default"
        />
      )}

      <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 flex flex-col">
        {sheet && (
          <div
            role="dialog"
            aria-label={sheet === "learn" ? tn("learn") : tn("more")}
            className="sheet-up bg-warm border-t-[1.5px] border-dashed border-dash rounded-t-[22px] px-4 pt-2.5 pb-4 max-h-[70vh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-dash mx-auto mb-1" aria-hidden="true" />

            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-[13px] font-black tracking-[.08em] uppercase text-success-deep px-0.5 pt-3 pb-1.5">
                  {tn(navKey(section.title))}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {section.items.map((item) => (
                    <Tile
                      key={item.href}
                      {...item}
                      on={item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)}
                      onNavigate={close}
                    />
                  ))}
                </div>
              </div>
            ))}

            {sheet === "more" && streakDays !== null && (
              <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[13px] py-[10px] mt-4 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
                <span className="text-lg">🔥</span>
                <div>
                  <b className="block text-[13px] font-semibold leading-tight text-[#5C4A0E]">{tn("dayStreak", { n: streakDays })}</b>
                </div>
              </div>
            )}
          </div>
        )}

        <nav
          className="bg-cream/90 backdrop-blur-[10px] border-t border-line grid grid-cols-4 pt-1 pb-[max(4px,env(safe-area-inset-bottom))]"
          aria-label="main"
        >
          <Link
            href="/dashboard"
            onClick={close}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1 text-[11.5px] transition-colors ${
              onGarden ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
            }`}
          >
            <span className="text-[21px] leading-none" style={onGarden ? {} : { filter: "grayscale(1)", opacity: 0.55 }}>
              🏡
            </span>
            {tn("garden")}
          </Link>
          <TabButton icon="📚" label={tn("learn")} on={onLearn} expanded={sheet === "learn"} onClick={() => toggle("learn")} />
          <Link
            href="/review"
            onClick={close}
            className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1 text-[11.5px] transition-colors ${
              onReview ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
            }`}
          >
            <span className="text-[21px] leading-none" style={onReview ? {} : { filter: "grayscale(1)", opacity: 0.55 }}>
              💧
            </span>
            {tn("practice")}
            {due > 0 && (
              <span className="absolute top-1 left-[calc(50%+6px)] min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10.5px] font-bold leading-[18px] text-center tabular-nums">
                {due > 99 ? "99+" : due}
              </span>
            )}
          </Link>
          <TabButton icon="🌿" label={tn("more")} on={onMore} expanded={sheet === "more"} onClick={() => toggle("more")} />
        </nav>
      </div>
    </>
  );
}
