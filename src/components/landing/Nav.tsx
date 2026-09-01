"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import { rememberLocale } from "@/i18n/locale";

const LANGUAGES = [
  { code: "en", label: "🇬🇧 English" },
  { code: "ja", label: "🇯🇵 日本語" },
  { code: "zh-Hans", label: "🇨🇳 中文" },
  { code: "vi", label: "🇻🇳 Tiếng Việt" },
];
// Reachable by URL only (pilot, partial translations) — shown as the current
// language when you're on it, but not offered in the list. Mirrors the
// dashboard sidebar's switcher, see Sidebar.tsx.
const HIDDEN_LANGUAGES = [{ code: "es", label: "🇪🇸 Español" }];

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (code: string) => {
    rememberLocale(code);
    router.replace(`${pathname}${window.location.search}${window.location.hash}`, { locale: code });
    setOpen(false);
  };

  const currentLang = [...LANGUAGES, ...HIDDEN_LANGUAGES].find((l) => l.code === locale) || LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-line bg-cream px-[10px] py-[7px] text-[12.5px] font-bold text-charcoal hover:bg-warm transition-colors"
      >
        <span>{currentLang.label.slice(0, 2)}</span>
        <span className="text-[10px] text-[#7A746A]">▼</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-40 bg-cream border border-dash rounded-[9px] shadow-lg z-50">
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
        </>
      )}
    </div>
  );
}

export default function Nav() {
  const t = useTranslations("landing.nav");
  // null = session unknown (first paint) — show the logged-out buttons, then
  // swap to the garden link once the client session check resolves.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      // Imported here, not at module scope. Nothing else on the landing page
      // touches Supabase, and a static top-level import pulled all of
      // @supabase/supabase-js — auth, PostgREST and the phoenix realtime
      // client the app never uses — into the first chunk every visitor
      // downloads: 66KB compressed to decide one button's label. The page is
      // fully readable and interactive without it.
      const { createClient, getClientUserId } = await import("@/lib/supabase/client");
      const userId = await getClientUserId(createClient());
      if (live) setLoggedIn(Boolean(userId));
    })();
    return () => {
      live = false;
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-dashed border-dash bg-cream/95 backdrop-blur-sm">
      <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,56px)] py-3">
        <Link
          href="/"
          className="flex items-center gap-[9px] font-extrabold text-[17px] tracking-[-0.01em] text-charcoal"
        >
          <BrandMark size={30} />
          Kroot
        </Link>

        <div className="hidden md:flex gap-7 text-[13px] font-semibold text-[#7A746A]">
          <a href="#learn" className="hover:text-charcoal transition-colors">{t("practice")}</a>
          <a href="#grow" className="hover:text-charcoal transition-colors">{t("howItGrows")}</a>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex rounded-full bg-success px-[16px] sm:px-[18px] py-[8px] text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors"
            >
              {t("myGarden")}
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex rounded-full border-[1.5px] border-line bg-cream px-[14px] sm:px-[16px] py-[7px] text-[12.5px] font-bold text-charcoal hover:bg-warm transition-colors"
              >
                {t("login")}
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex rounded-full bg-success px-[14px] sm:px-[17px] py-[8px] text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors"
              >
                {t("startFree")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
