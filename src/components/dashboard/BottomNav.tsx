"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";
import { useBackToClose } from "@/hooks/useBackToClose";
import { LanguageSwitcher } from "@/components/dashboard/Sidebar";

// Four tabs: Garden · Basics · Practice · More — equal-width cells that fill
// the bar edge to edge. Basics (guide/hangul/grammar/vocab) and Practice
// (listening/pronunciation/writing/reading) used to share one "Learn" tab's
// sheet and a separate tab linked straight to /review — that review tab's
// label collided with the sidebar's own "Practice" section name and read as
// broken. Split into their own tabs instead; review is reached from the
// dashboard's own Today's review card, not a bottom-nav shortcut.
type Sheet = "basics" | "practice" | "more" | null;

// nav.json keys: single-word labels lowercase 1:1 ("Garden" → garden);
// multi-word ones are stored as the key itself ("My account" → myAccount).
const navKey = (label: string) =>
  label === "My progress" ? "myProgress" : label === "My word bank" ? "myWords" : /[A-Z]/.test(label.slice(1)) ? label : label.toLowerCase();

const BASICS_SECTIONS = SECTIONS.filter((s) => s.title === "Basics");
const PRACTICE_SECTIONS = SECTIONS.filter((s) => s.title === "Practice");
const MORE_SECTIONS = [
  // MAIN_ITEMS already carries Garden + My account.
  { title: "myPage", items: MAIN_ITEMS },
  ...SECTIONS.filter((s) => s.title !== "Basics" && s.title !== "Practice"),
];
const BASICS_PATHS = BASICS_SECTIONS.flatMap((s) => s.items.map((i) => i.href));
const PRACTICE_PATHS = PRACTICE_SECTIONS.flatMap((s) => s.items.map((i) => i.href));

// Text-only, same idiom as the desktop Sidebar's NavItem — no icon, no color
// tile, just the label with a bold/tinted active state, laid out as a grid of
// thumb-sized cells with a centred label (2026-09-03, per mockup 590fe47e).
// Basics/Practice hold exactly four items → 2×2; More holds two sections of
// three (My page, Relax) → one 3-wide row each, with a slightly smaller label
// because a 3-column cell on a 390px phone is only ~105px wide.
function Tile({
  label,
  href,
  on,
  onNavigate,
  popular,
  isNew,
  tourId,
  cols,
}: {
  label: string;
  href: string;
  on: boolean;
  onNavigate: () => void;
  color?: NavColor;
  popular?: boolean;
  isNew?: boolean;
  tourId?: string;
  cols: 2 | 3;
}) {
  const tn = useTranslations("nav");
  const sticker = popular ? (
    <span className="absolute -top-[7px] right-2.5 text-[8.5px] font-extrabold text-[#B14F27] bg-[#FDE9D0] rounded-full px-[6px] py-px">
      Popular
    </span>
  ) : isNew ? (
    <span className="absolute -top-[7px] right-2.5 text-[8.5px] font-extrabold text-white bg-[#9333EA] rounded-full px-[6px] py-px">
      NEW
    </span>
  ) : null;
  return (
    <Link
      href={href}
      data-tour={tourId}
      onClick={onNavigate}
      className={`relative flex items-center justify-center min-h-[72px] rounded-[14px] border-[1.5px] text-center font-extrabold leading-tight text-balance transition-colors ${
        cols === 3 ? "px-1.5 py-3 text-[14.5px]" : "px-2.5 py-4 text-[16.5px]"
      } ${
        on
          ? "border-success bg-success-bg text-success-deep"
          : "border-line bg-cream text-charcoal hover:border-success hover:text-success-deep"
      }`}
    >
      {tn(navKey(label))}
      {sticker}
    </Link>
  );
}

function TabButton({
  label,
  on,
  onClick,
  expanded,
  tourId,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  expanded?: boolean;
  tourId?: string;
}) {
  return (
    <button
      type="button"
      data-tour={tourId}
      onClick={onClick}
      aria-expanded={expanded}
      className={`flex items-center justify-center min-h-[56px] py-1 text-[13px] transition-colors ${
        on ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
      }`}
    >
      {label}
    </button>
  );
}

// streakDays is something the server page usually already knows. Passing it
// in skips the client fetch entirely; leaving it out keeps the old
// self-fetching behaviour for pages that don't have it to hand.
export default function BottomNav({ streakDays: streakDaysProp }: { streakDays?: number | null } = {}) {
  const pathname = usePathname();
  const locale = useLocale();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [fetchedStreak, setFetchedStreak] = useState<number | null>(null);
  const streakDays = streakDaysProp ?? fetchedStreak;

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

  // Back closes the sheet rather than leaving the page — it is a hardware
  // button in the Play Store wrapper.
  const closeSheet = useCallback(() => setSheet(null), []);
  const dismissSheet = useBackToClose(sheet !== null, closeSheet);

  const tn = useTranslations("nav");
  const close = () => setSheet(null);
  // Tapping the open tab again closes it — route that through dismiss so the
  // history entry the sheet added goes with it.
  const toggle = (s: Exclude<Sheet, null>) => {
    if (sheet === s) dismissSheet();
    else setSheet(s);
  };
  const sections = sheet === "basics" ? BASICS_SECTIONS : sheet === "practice" ? PRACTICE_SECTIONS : sheet === "more" ? MORE_SECTIONS : [];

  const onGarden = !sheet && pathname === "/dashboard";
  const onBasics = sheet === "basics" || (!sheet && BASICS_PATHS.some((p) => pathname.startsWith(p)));
  const onPractice = sheet === "practice" || (!sheet && PRACTICE_PATHS.some((p) => pathname.startsWith(p)));
  const onMore = sheet === "more" || (!sheet && !onGarden && !onBasics && !onPractice && pathname !== "/dashboard");

  return (
    <>
      {sheet && (
        <button
          aria-label={tn("closeMenu")}
          onClick={dismissSheet}
          className="md:hidden fixed inset-0 z-40 bg-[#282319]/35 cursor-default"
        />
      )}

      <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 flex flex-col">
        {sheet && (
          <div
            role="dialog"
            aria-label={sheet === "basics" ? tn("basics") : sheet === "practice" ? tn("practice") : tn("more")}
            className="sheet-up bg-warm border-t-[1.5px] border-dashed border-dash rounded-t-[22px] px-4 pt-2.5 pb-4 max-h-[70vh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-dash mx-auto mb-1" aria-hidden="true" />

            {sections.map((section) => (
              <div key={section.title}>
                <p className="text-[13px] font-black tracking-[.08em] uppercase text-success-deep px-0.5 pt-3 pb-1.5">
                  {tn(navKey(section.title))}
                </p>
                <div className={sheet === "more" ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2.5"}>
                  {section.items.map((item) => (
                    <Tile
                      key={item.href}
                      {...item}
                      cols={sheet === "more" ? 3 : 2}
                      on={item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)}
                      onNavigate={close}
                    />
                  ))}
                </div>
              </div>
            ))}

            {sheet === "more" && (
              <div className="mt-4 pt-3 border-t border-line">
                <LanguageSwitcher pathname={pathname} locale={locale} />
              </div>
            )}

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
          data-tour="mobile-nav"
          className="bg-cream/90 backdrop-blur-[10px] border-t border-line grid grid-cols-4 pt-1 pb-[max(4px,env(safe-area-inset-bottom))]"
          aria-label="main"
        >
          <Link
            href="/dashboard"
            onClick={close}
            className={`flex items-center justify-center min-h-[56px] py-1 text-[13px] transition-colors ${
              onGarden ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
            }`}
          >
            {tn("garden")}
          </Link>
          <TabButton tourId="tab-basics" label={tn("basics")} on={onBasics} expanded={sheet === "basics"} onClick={() => toggle("basics")} />
          <TabButton tourId="tab-practice" label={tn("practice")} on={onPractice} expanded={sheet === "practice"} onClick={() => toggle("practice")} />
          <TabButton tourId="tab-more" label={tn("more")} on={onMore} expanded={sheet === "more"} onClick={() => toggle("more")} />
        </nav>
      </div>
    </>
  );
}
