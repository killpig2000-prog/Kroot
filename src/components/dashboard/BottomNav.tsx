"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_ITEMS } from "@/components/dashboard/navItems";
import { playTap } from "@/lib/sfx";

// Five flat tabs (2026-09-10, see navItems.ts). At 360px a tab is 72px
// wide, so labels come from shortKey where the full one wouldn't fit, the
// type drops to 11px, and every label is one clipped line — a tab that
// wraps would push the bar taller than the 56px tap target it sits in.
export default function BottomNav() {
  const pathname = usePathname();
  const tn = useTranslations("nav");

  return (
    <nav
      data-tour="mobile-nav"
      className="xl:hidden fixed left-0 right-0 bottom-0 z-50 bg-cream/90 backdrop-blur-[10px] border-t border-line grid grid-cols-5 pt-1 pb-[max(4px,env(safe-area-inset-bottom))]"
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
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] px-0.5 py-1 text-[11px] select-none touch-manipulation transition-[color,transform] duration-100 active:scale-[.92] ${
              on ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
            }`}
          >
            <span className="text-[16px] leading-none" aria-hidden="true">
              {item.icon}
            </span>
            <span className="max-w-full truncate leading-tight">
              {tn(item.shortKey ?? item.i18nKey ?? item.label.toLowerCase())}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
