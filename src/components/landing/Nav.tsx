"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import BrandMark from "@/components/ui/BrandMark";

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

        {loggedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex rounded-full bg-success px-[16px] sm:px-[18px] py-[8px] text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors"
          >
            {t("myGarden")}
          </Link>
        ) : (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </nav>
  );
}
