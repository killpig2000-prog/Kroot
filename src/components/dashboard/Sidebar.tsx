"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { rememberLocale } from "@/i18n/locale";
import AccountMenu from "@/components/dashboard/AccountMenu";
import { Link } from "@/i18n/navigation";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";

import BrandMark from "@/components/ui/BrandMark";

// Nav labels map 1:1 to nav.json keys, except the two-word ones.
const navKey = (label: string) =>
  label === "My progress" ? "myProgress" : label === "My word bank" ? "myWords" : label.toLowerCase();

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "ja", label: "日本語" },
  { code: "zh-Hans", label: "中文" },
  { code: "vi", label: "Tiếng Việt" },
];
// Reachable by URL only (pilot, partial translations) — shown as the current
// language when you're on it, but not offered in the list.
const HIDDEN_LANGUAGES: { code: string; label: string }[] = [];

// The sidebar renders every item quiet on purpose — text only, no emoji, no
// color tiles, no "Popular" badges (those still show in the phone Menu sheet).
// 13 always-visible destinations beat an accordion that hides half of them.
function NavItem({
  label,
  href,
  on,
  isNew,
  tourId,
  alert,
}: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  color?: NavColor;
  popular?: boolean;
  isNew?: boolean;
  tourId?: string;
  /** Quiet "there's something here" dot — currently the promotion test. */
  alert?: boolean;
}) {
  const tn = useTranslations("nav");
  // Active item reads like a notebook index tab: white paper, dashed edge,
  // open on the right so it "connects" to the page.
  const link = (
    <Link
      href={href}
      data-tour={tourId}
      className={`flex items-center gap-2 px-2.5 py-[6px] text-[13.5px] transition-colors ${
        on
          ? "bg-cream border border-dashed border-dash border-r-0 rounded-l-[10px] -mr-3.5 text-success-deep font-bold"
          : "rounded-[9px] text-charcoal font-medium hover:bg-cream hover:text-success-deep"
      }`}
    >
      <span className="flex-1 min-w-0 truncate">{tn(navKey(label))}</span>
      {alert && (
        <span className="flex-none w-[7px] h-[7px] rounded-full bg-danger" aria-hidden="true" />
      )}
      {isNew && !on && (
        <span className="flex-none text-[8.5px] font-extrabold tracking-[.04em] text-white bg-[#9333EA] rounded-full px-[5px] py-px">
          {tn("new").toUpperCase()}
        </span>
      )}
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
  /**
   * Dot the My progress entry — the learner just became eligible for the
   * promotion test and would otherwise have to go looking. Only the dashboard
   * passes it: working it out costs three queries, so every other page leaves
   * it off rather than paying for a badge on a page they're already past.
   */
  progressAlert?: boolean;
};

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-[9px] font-extrabold text-[17px] tracking-[-0.01em] text-charcoal">
      <BrandMark size={30} />
      Kroot
    </Link>
  );
}

export function LanguageSwitcher({ pathname, locale }: { pathname: string; locale: string }) {
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
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-[13.5px] rounded-[9px] text-charcoal font-medium hover:bg-cream transition-colors text-left disabled:opacity-70"
      >
        <span className="truncate flex items-center gap-1.5">
          {isPending && (
            <span
              className="inline-block w-3 h-3 rounded-full border-2 border-line border-t-success-deep animate-spin flex-none"
              aria-hidden="true"
            />
          )}
          {isPending ? `${pendingLabel}…` : "Language"}
        </span>
        <span className="text-xs">▼</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-cream border border-dash rounded-[9px] shadow-lg z-50">
          <div className="text-[12px] text-muted px-2.5 py-1.5 font-semibold uppercase tracking-[.06em]">
            {currentLang.label}
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code, lang.label)}
              className={`w-full text-left px-2.5 py-2 text-[13px] rounded-[9px] transition-colors ${
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
  progressAlert,
  pathname,
  locale,
  onClose,
}: Props & { pathname: string; locale: string; onClose?: () => void }) {
  const tn = useTranslations("nav");
  return (
    <>
      <div className="flex items-center px-2.5 pb-[18px]">
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

      {/* Personal destinations (Garden / My progress / My word bank) sit in
          their own tinted card so they read as "your space", distinct from
          the learning menu below — no label needed, the container says it. */}
      <div className="flex flex-col gap-0.5 bg-cream border border-dash rounded-[10px] p-1 mb-2">
        {MAIN_ITEMS.map((item) => (
          <NavItem
            key={item.label}
            {...item}
            on={pathname === item.href}
            alert={progressAlert && item.href === "/profile"}
          />
        ))}
      </div>

      {SECTIONS.map((section) => (
        <div
          key={section.title}
          data-tour={`section-${section.title.toLowerCase()}`}
          className="flex flex-col gap-0.5 pt-2.5 mt-1 border-t border-line"
        >
          <p className="text-[12.5px] font-extrabold tracking-[.07em] uppercase text-success-deep px-3 pb-1.5">
            {tn(section.title.toLowerCase())}
          </p>
          <div className="flex flex-col gap-0.5">
            {section.items.map((item) => (
              <NavItem key={item.label} {...item} on={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-1 pt-4">
        <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[13px] py-[11px] mb-1.5 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
          <span className="text-lg">🔥</span>
          <div>
            <b className="block text-[13.5px] font-semibold leading-tight text-[#5C4A0E]">{tn("dayStreak", { n: streakDays })}</b>
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
      {/* Desktop (md+, tablets included): the notebook-index column. */}
      <aside className="hidden md:flex flex-col gap-1 border-r border-dashed border-dash bg-warm px-3.5 py-5 sticky top-0 h-screen overflow-y-auto">
        <SidebarBody {...props} pathname={pathname} locale={locale} />
      </aside>

      {/* Phone (below md): a slim identity bar only — BottomNav is the sole
          nav surface down here, no slide-in drawer duplicating it. Account
          settings and the language switcher live in AccountMenu (avatar
          below) and BottomNav's "More" sheet respectively. */}
      <header className="md:hidden sticky top-0 z-30 h-[52px] flex items-center gap-2 pl-3 pr-3 bg-warm/90 backdrop-blur-[10px] border-b-[1.5px] border-dashed border-dash">
        <Brand />
        <span className="flex-1" />
        <span
          aria-label={`${props.streakDays} day streak`}
          className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-[#ECD98A] bg-[#FEF9C3] text-[#5C4A0E] text-[12.5px] font-bold tabular-nums"
        >
          🔥 {props.streakDays}
        </span>
        <AccountMenu displayName={props.displayName} email={props.email} avatarUrl={props.avatarUrl} compact />
      </header>
    </>
  );
}
