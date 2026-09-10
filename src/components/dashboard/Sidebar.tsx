"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { LANGUAGES, rememberLocale } from "@/i18n/locale";
import AccountMenu from "@/components/dashboard/AccountMenu";
import { Link } from "@/i18n/navigation";
import { MAIN_ITEMS, MODULES, MY_ROOM_ITEMS, type NavColor } from "@/components/dashboard/navItems";

import BrandMark from "@/components/ui/BrandMark";
import Glyph from "@/components/dashboard/Glyph";
import StreakRingPill from "@/components/dashboard/StreakRingPill";
import type { DayDepth } from "@/lib/growth-rings";

// Nav labels map 1:1 to nav.json keys unless the item names its own
// (i18nKey), which the two-word ones do.
const navKey = (label: string) => label.toLowerCase();

// LANGUAGES lives in @/i18n/locale — the lesson bar's pill lists the same set.
// Reachable by URL only (pilot, partial translations) — shown as the current
// language when you're on it, but not offered in the list.
const HIDDEN_LANGUAGES: { code: string; label: string }[] = [];

// The sidebar renders every item quiet on purpose — text only, no emoji, no
// color tiles. Three flat destinations (2026-09-07 restructure) instead of
// 13 always-visible ones — the module list moved to the Garden page's own
// grid, and My room absorbed Shop/Ranking/word bank.
function NavItem({
  label,
  href,
  on,
  tourId,
  i18nKey,
}: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  color?: NavColor;
  popular?: boolean;
  isNew?: boolean;
  tourId?: string;
  i18nKey?: string;
  shortKey?: string;
}) {
  const tn = useTranslations("nav");
  // Active item reads like a notebook index tab: white paper, dashed edge,
  // open on the right so it "connects" to the page.
  const link = (
    <Link
      href={href}
      data-tour={tourId}
      className={`flex items-center gap-2 px-2.5 py-[8px] text-[14px] transition-colors ${
        on
          ? "bg-cream border border-dashed border-dash border-r-0 rounded-l-[10px] -mr-3.5 text-success-deep font-bold"
          : "rounded-[12px] text-charcoal font-medium hover:bg-cream hover:text-success-deep"
      }`}
    >
      <span className="flex-1 min-w-0 truncate">{tn(i18nKey ?? navKey(label))}</span>
    </Link>
  );

  return link;
}

type Props = {
  displayName: string;
  email: string;
  streakDays: number;
  avatarUrl?: string | null;
  /** Streak freezes held (shop consumable, migration 0035). */
  streakFreezes?: number;
  /** Coin balance. Only the Garden passes it (the one page that reads
      `profiles.coins`); the phone header shows a second pill when it does. */
  coins?: number;
  /** Growth rings (Garden only): this week's Mon..Sun depths — when passed,
      the phone streak pill draws the week ring where the flame was. */
  weekRing?: DayDepth[];
  /** 0 = Monday … 6 = Sunday, the segment that is today */
  ringToday?: number;
  /** A lesson index page renders its own LessonBar in place of the phone
   *  header (← · name · language · level) — the identity bar stands down
   *  below xl so the two don't stack. The desktop column is unaffected. */
  lessonBar?: boolean;
};

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-[8px] font-extrabold text-[17px] tracking-[-0.01em] text-charcoal">
      <BrandMark size={30} />
      Kroot
    </Link>
  );
}

export function LanguageSwitcher({
  pathname,
  locale,
  variant = "sidebar",
}: {
  pathname: string;
  locale: string;
  /** "sidebar" sits at the bottom of the nav column, so its list opens
   *  upward and the button reads "Language" above the nav it belongs to.
   *  "row" is the Settings page, where the row is already labelled and the
   *  useful thing to show is which language is on. */
  variant?: "sidebar" | "row";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // The locale re-render is a full RSC round-trip, so it can take a beat —
  // without this, a click on a slow connection looks like nothing happened.
  const [isPending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  // next-intl's router keeps the current locale unless told otherwise, so
  // pushing a hand-built "/ja/..." path either doubled the prefix or, for
  // English, silently stayed on the old locale. `pathname` from
  // @/i18n/navigation is already locale-less; let the router add the prefix.
  const handleLanguageChange = (code: string, label: string) => {
    if (code === locale) {
      setOpen(false);
      return;
    }
    rememberLocale(code);
    setPendingLabel(label);
    setOpen(false);
    startTransition(() => {
      // Keep ?level=&unit= and #anchors — the switch shouldn't lose your place.
      router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: code });
    });
  };

  const currentLang = [...LANGUAGES, ...HIDDEN_LANGUAGES].find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => !isPending && setOpen(!open)}
        disabled={isPending}
        aria-busy={isPending}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-[14px] rounded-[12px] text-charcoal font-medium hover:bg-cream transition-colors text-left disabled:opacity-70"
      >
        <span className="truncate flex items-center gap-1.5">
          {isPending && (
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-line border-t-success-deep animate-spin flex-none"
              aria-hidden="true"
            />
          )}
          {isPending ? `${pendingLabel}…` : variant === "row" ? currentLang.label : "Language"}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 bg-cream border border-dash rounded-[12px] shadow-lg z-50 ${
            variant === "row" ? "top-full mt-1" : "bottom-full mb-1"
          }`}
        >
          <div className="text-[12.5px] text-muted px-2.5 py-1.5 font-semibold uppercase tracking-[.06em]">
            {currentLang.label}
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code, lang.label)}
              className={`w-full text-left px-2.5 py-2 text-[12.5px] rounded-[12px] transition-colors ${
                locale === lang.code
                  ? "bg-success-deep/10 text-success-deep font-bold"
                  : "text-charcoal hover:bg-warm"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The nav body — one source for the desktop column and the phone drawer, so
// the two never drift apart (same order, icons, badges, streak note, account).
function SidebarBody({
  displayName,
  email,
  streakDays,
  avatarUrl,
  pathname,
  locale,
  onClose,
}: Props & { pathname: string; locale: string; onClose?: () => void }) {
  const tn = useTranslations("nav");
  return (
    <>
      <div className="flex items-center px-2.5 pb-[16px]">
        <Brand />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={tn("closeMenu")}
            className="ml-auto -mr-1 w-8 h-8 rounded-lg text-lg text-muted hover:bg-cream flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>

      {/* Garden / My progress / Review / My room / Settings — the same five
          tabs the phone bar has. Unlabelled on purpose: the group's shape
          (the app's own places, above the lesson list) says enough. */}
      <div className="flex flex-col gap-0.5 bg-cream border border-dash rounded-[12px] p-1 mb-2">
        {MAIN_ITEMS.map((item) => (
          <NavItem key={item.label} {...item} on={item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)} />
        ))}
      </div>

      {/* Desktop only (this body is only ever mounted inside the xl+ aside
          below): the six modules and the three My room rows laid out flat,
          the way the pre-restructure 13-item sidebar did — a screen wide
          enough for a column doesn't need the Garden page's own grid or a
          My room visit to see where everything is. Phones and tablets never
          render this; the module grid there is their only module list. */}
      <div className="flex flex-col gap-0.5 pt-2.5 mt-1 border-t border-line">
        <p className="text-[12.5px] font-extrabold tracking-[.07em] uppercase text-success-deep px-3 pb-1.5">{tn("learn")}</p>
        <div className="flex flex-col gap-0.5">
          {MODULES.map((item) => (
            <NavItem key={item.label} {...item} on={pathname.startsWith(item.href)} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 pt-2.5 mt-1 border-t border-line">
        <p className="text-[12.5px] font-extrabold tracking-[.07em] uppercase text-success-deep px-3 pb-1.5">{tn("myRoom")}</p>
        <div className="flex flex-col gap-0.5">
          {MY_ROOM_ITEMS.map((item) => (
            <NavItem key={item.label} {...item} on={pathname.startsWith(item.href)} />
          ))}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[12px] py-[12px] mb-1.5 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
          <Glyph name="flame" className="w-[19px] h-[19px]" />
          <div>
            <b className="block text-[14px] font-semibold leading-tight text-[#5C4A0E]">{tn("dayStreak", { n: streakDays })}</b>
          </div>
        </div>

        <LanguageSwitcher pathname={pathname} locale={locale} />
        <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </>
  );
}

export default function Sidebar(props: Props) {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <>
      {/* Desktop (xl+ — 1280px, laptop and up): the notebook-index column,
          full module list included. Phones AND tablets (including iPad
          landscape at 1024px) get the slim header + BottomNav below instead
          — 2026-09-08, user call: only a real desktop should feel this
          different from the phone. */}
      <aside className="hidden xl:flex flex-col gap-1 border-r border-dashed border-dash bg-warm px-3.5 py-5 sticky top-0 h-screen overflow-y-auto">
        <SidebarBody {...props} pathname={pathname} locale={locale} />
      </aside>

      {/* Phone and tablet (below xl): a slim identity bar only — BottomNav is
          the sole nav surface down here, no slide-in drawer duplicating it.
          Account settings and the language switcher live in AccountMenu
          (avatar below) and BottomNav's "More" sheet respectively. */}
      {!props.lessonBar && (
      <header className="xl:hidden sticky top-0 z-30 h-[52px] flex items-center gap-2 pl-3 pr-3 bg-warm/90 backdrop-blur-[10px] border-b-[1.5px] border-dashed border-dash">
        <Brand />
        <span className="flex-1" />
        {/* Streak, and on the Garden the coins too — the two numbers the
            greeting row used to carry (2026-09-10, user call: they belong in
            the status bar, not beside the learner's name). Same pill for
            both so they read as one set. */}
        {/* On the Garden the flame gives way to this week's growth ring
            (2026-09-10): same pill, same number, the icon is now the week. */}
        {props.weekRing ? (
          <StreakRingPill
            week={props.weekRing}
            today={props.ringToday ?? 0}
            streakDays={props.streakDays}
            label={`${props.streakDays} day streak`}
          />
        ) : (
          <span
            aria-label={`${props.streakDays} day streak`}
            className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-[#ECD98A] bg-[#FEF9C3] text-[#5C4A0E] text-[12.5px] font-bold tabular-nums"
          >
            <Glyph name="flame" className="w-[14px] h-[14px]" /> {props.streakDays}
          </span>
        )}
        {props.coins !== undefined && (
          <span
            aria-label={`${props.coins} coins`}
            className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-[#ECD98A] bg-[#FEF9C3] text-[#5C4A0E] text-[12.5px] font-bold tabular-nums"
          >
            <Glyph name="coin" className="w-[14px] h-[14px]" /> {props.coins}
          </span>
        )}
        <AccountMenu displayName={props.displayName} email={props.email} avatarUrl={props.avatarUrl} compact />
      </header>
      )}
    </>
  );
}
