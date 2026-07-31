"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
  { icon: "📊", label: "Growth", href: "/profile" },
  { icon: "🏕️", label: "Friends", href: "/community" },
  { icon: "🛍️", label: "Shop", href: "/shop" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed left-0 right-0 bottom-0 bg-white/90 backdrop-blur-[10px] border-t border-[#E7E5E4] flex justify-center gap-1 py-2 z-50"
      aria-label="main"
    >
      {ITEMS.map((item) => {
        const on = pathname === item.href.split("#")[0];
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-px rounded-lg px-[22px] py-[7px] text-[11px] font-medium transition-colors ${
              on ? "text-[#18181B]" : "text-[#A1A1AA] hover:text-[#71717A]"
            }`}
          >
            <span
              className="text-[17px] transition-transform hover:-translate-y-0.5"
              style={on ? {} : { filter: "grayscale(1)", opacity: 0.55 }}
            >
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
