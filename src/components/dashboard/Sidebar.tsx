"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { rememberLocale } from "@/i18n/locale";
import AccountMenu from "@/components/dashboard/AccountMenu";
import { Link } from "@/i18n/navigation";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";

import BrandMark from "@/components/ui/BrandMark";

// Nav labels map 1:1 to nav.json keys, except the two-word ones.
const navKey = (label: string) =>
  label === "My account" ? "myAccount" : label === "My word bank" ? "myWords" : label.toLowerCase();

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "zh-Hans", label: "🇨🇳 中文" },
  { code: "vi", label: "🇻🇳 Tiếng Việt" },
];
// Reachable by URL only (pilot, partial translations) — shown as the current
// language when you're on it, but not offered in the list.
const HIDDEN_LANGUAGES = [{ code: "es", label: "🇪🇸 Español" }];

function NavItem({
  icon,
  label,
  href,
  on,
  color,
  popular,
  isNew,
}: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  color?: NavColor;
  popular?: boolean;
  isNew?: boolean;
}) {
  const tn = useTranslations("nav");
  // Active item reads like a notebook index tab: white paper, dashed edge,
  // open on the right so it "connects" to the page.
  const link = (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2.5 py-2 text-[13.5px] transition-colors ${
        on
          ? "bg-cream border border-dashed border-dash border-r-0 rounded-l-[10px] -mr-3.5 text-success-deep font-bold"
          : "rounded-[9px] text-charcoal font-medium hover:bg-cream hover:text-success-deep"
      }`}
    >
      {color ? (
        <span
          className="flex-none w-5 h-5 rounded-[6px] border flex items-center justify-center text-[11px]"
          style={{ background: color.bg, borderColor: color.border, color: color.text }}
        >
          {icon}
        </span>
      ) : (
        <span className="text-base">{icon}</span>
      )}
      <span className="flex-1 min-w-0 truncate">{tn(navKey(label))}</span>
      {popular && (
        <span className="flex-none text-[8.5px] font-extrabold tracking-[.02em] text-[#B14F27] bg-[#FDE9D0] rounded-full px-[5px] py-px">
          {tn("popular")}
        </span>
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
};

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-[9px] font-extrabold text-[17px] tracking-[-0.01em] text-charcoal">
      <BrandMark size={30} />
      Kroot
    </Link>
  );
}

function LanguageSwitcher({ pathname, locale }: { pathname: string; locale: string }) {
  const router = useRouter();
  const tn = useTranslations("nav");
  const [open, setOpen] = useState(false);

  // next-intl's router keeps the current locale unless told otherwise, so
  // pushing a hand-built "/ja/..." path either doubled the prefix or, for
  // English, silently stayed on the old locale. `pathname` from
  // @/i18n/navigation is already locale-less; let the router add the prefix.
  const handleLanguageChange = (code: string) => {
    rememberLocale(code);
    // Keep ?level=&unit= and #anchors — the switch shouldn't lose your place.
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: code });
    setOpen(false);
  };

  const currentLang = [...LANGUAGES, ...HIDDEN_LANGUAGES].find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-2 text-[13.5px] rounded-[9px] text-charcoal font-medium hover:bg-cream transition-colors text-left"
      >
        <span className="truncate">🌐 Language</span>
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
              onClick={() => handleLanguageChange(lang.code)}
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
  streakFreezes = 0,
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
            aria-label="Close menu"
            className="ml-auto -mr-1 w-8 h-8 rounded-lg text-lg text-muted hover:bg-cream flex items-center justify-center"
          >
            ×
          </button>
        )}
      </div>

      {MAIN_ITEMS.map((item) => (
        <NavItem key={item.label} {...item} on={pathname === item.href} />
      ))}

      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="text-[13px] font-black tracking-[.08em] uppercase text-success-deep px-3 pt-3.5 pb-1.5">
            {tn(section.title.toLowerCase())}
          </p>
          <div className="flex flex-col gap-1.5">
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
            {streakFreezes > 0 && (
              <small className="text-[11.5px] text-[#8A7420]">
                🧊 {streakFreezes} freeze{streakFreezes === 1 ? "" : "s"} ready
              </small>
            )}
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
  const tn = useTranslations("nav");
  const [open, setOpen] = useState(false);

  // Close the drawer when the route changes (tap on a nav item, browser
  // back) — computed during render so it doesn't cost an extra paint.
  const [openForPathname, setOpenForPathname] = useState(pathname);
  if (pathname !== openForPathname) {
    setOpenForPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const avatar = props.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.avatarUrl} alt="" className="w-full h-full object-cover" />
  ) : (
    "🦊"
  );

  return (
    <>
      {/* Desktop: the notebook-index column. */}
      <aside className="hidden md:flex flex-col gap-1 border-r border-dashed border-dash bg-warm px-3.5 py-5 sticky top-0 h-screen overflow-y-auto">
        <SidebarBody {...props} pathname={pathname} locale={locale} />
      </aside>

      {/* Phone: the same column folded into a 52px header — menu button,
          logo, streak, avatar — so the app carries its identity on every
          screen instead of starting at the breadcrumb. */}
      <header className="md:hidden sticky top-0 z-30 h-[52px] flex items-center gap-2 pl-1.5 pr-3 bg-warm/90 backdrop-blur-[10px] border-b-[1.5px] border-dashed border-dash">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          aria-expanded={open}
          className="w-10 h-10 rounded-[10px] flex flex-col items-center justify-center gap-[5px] hover:bg-cream active:bg-cream"
        >
          <span className="block w-[18px] h-0.5 rounded-full bg-charcoal" />
          <span className="block w-[18px] h-0.5 rounded-full bg-charcoal" />
          <span className="block w-[18px] h-0.5 rounded-full bg-charcoal" />
        </button>
        <Brand />
        <span className="flex-1" />
        <span
          aria-label={tn("dayStreak", { n: props.streakDays })}
          className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-[#ECD98A] bg-[#FEF9C3] text-[#5C4A0E] text-[12.5px] font-bold tabular-nums"
        >
          🔥 {props.streakDays}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Account"
          className="w-9 h-9 rounded-full bg-warm border border-line flex items-center justify-center text-base overflow-hidden"
        >
          {avatar}
        </button>
      </header>

      {/* Drawer — the desktop sidebar verbatim, sliding in from the left. */}
      <div
        className={`md:hidden fixed inset-0 z-[60] bg-[#282319]/35 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        className={`md:hidden fixed inset-y-0 left-0 z-[70] w-[280px] max-w-[85vw] flex flex-col gap-1 border-r border-dashed border-dash bg-warm px-3.5 py-5 overflow-y-auto shadow-[12px_0_40px_-24px_rgba(40,35,25,.5)] transition-transform duration-250 ease-[cubic-bezier(.2,.8,.2,1)] motion-reduce:transition-none ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarBody {...props} pathname={pathname} locale={locale} onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
