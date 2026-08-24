"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  const supabase = useMemo(() => createClient(), []);
  // null = session unknown (first paint) — show the logged-out buttons, then
  // swap to the garden link once the client session check resolves.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      setLoggedIn(Boolean(data.user));
    })();
  }, [supabase]);

  return (
    <nav className="sticky top-0 z-50 border-b border-dashed border-[#DDD6C8] bg-[#FFFFFF]/95 backdrop-blur-sm">
      <div className="max-w-[1160px] mx-auto flex items-center justify-between gap-4 px-[clamp(18px,5vw,56px)] py-3">
        <Link
          href="/"
          className="flex items-center gap-[9px] font-extrabold text-[17px] tracking-[-0.01em] text-[#221F1B]"
        >
          <span className="w-[30px] h-[30px] rounded-lg bg-[#16A34A] text-white flex items-center justify-center kr text-sm">
            한
          </span>
          Kroot
        </Link>

        <div className="hidden md:flex gap-7 text-[13px] font-semibold text-[#7A746A]">
          <a href="#learn" className="hover:text-[#221F1B] transition-colors">Practice</a>
          <a href="#grow" className="hover:text-[#221F1B] transition-colors">How it grows</a>
        </div>

        {loggedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex rounded-full bg-[#16A34A] px-[16px] sm:px-[18px] py-[8px] text-[12.5px] font-bold text-white hover:bg-[#15803D] transition-colors"
          >
            My garden →
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="inline-flex rounded-full border-[1.5px] border-[#E3DDD0] bg-white px-[14px] sm:px-[16px] py-[7px] text-[12.5px] font-bold text-[#221F1B] hover:bg-[#FAF7EF] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex rounded-full bg-[#16A34A] px-[14px] sm:px-[17px] py-[8px] text-[12.5px] font-bold text-white hover:bg-[#15803D] transition-colors"
            >
              Start free 🌱
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
