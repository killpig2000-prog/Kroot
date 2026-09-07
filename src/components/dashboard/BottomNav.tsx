"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_ITEMS } from "@/components/dashboard/navItems";
import { playTap } from "@/lib/sfx";

// nav.json keys: single-word labels lowercase 1:1 ("Garden" → garden);
// multi-word ones are stored as the key itself ("My progress" → myProgress).
const navKey = (label: string) =>
  label === "Learn" ? "learn" : label === "My room" ? "myRoom" : label.toLowerCase();

// Three flat tabs — no more category sheets. Basics/Practice/Relax's eleven
// destinations moved onto the Garden page itself (the module grid) and into
// My room (Shop, Ranking, My word bank); nothing here needs to expand.
// 2026-09-07, step 1 of the My Room restructure (see navItems.ts).
export default function BottomNav() {
  const pathname = usePathname();
  const tn = useTranslations("nav");

  return (
    <nav
      data-tour="mobile-nav"
      className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-cream/90 backdrop-blur-[10px] border-t border-line grid grid-cols-3 pt-1 pb-[max(4px,env(safe-area-inset-bottom))]"
      aria-label="main"
    >
      {MAIN_ITEMS.map((item) => {
        const on = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.tourId}
            onClick={playTap}
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1 text-[13px] transition-colors ${
              on ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
            }`}
          >
            <span className="text-[17px] leading-none" aria-hidden="true">
              {item.icon}
            </span>
            {tn(navKey(item.label))}
          </Link>
        );
      })}
    </nav>
  );
}
