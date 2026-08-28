"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";

// "Me" left the tab bar (2026-08-28) — account settings aren't a place people
// go often enough to spend one of three tabs on. It moves into the menu sheet
// below, which is the only other way to reach /profile on a phone.
const ITEMS = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
  { icon: "🛍️", label: "Shop", href: "/shop" },
];

const ACCOUNT_ITEM = { icon: "👤", label: "My account", href: "/profile" };

const RAINBOW = "linear-gradient(90deg,#F43F5E,#F59E0B,#22C55E,#0EA5E9,#8B5CF6)";

function Tile({
  icon,
  label,
  href,
  on,
  onNavigate,
  color,
  popular,
  isNew,
}: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  onNavigate: () => void;
  color?: NavColor;
  popular?: boolean;
  isNew?: boolean;
}) {
  const tile = (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative flex flex-col items-center gap-1 rounded-[12px] border bg-white px-1 py-2.5 text-center text-[11px] font-bold transition-colors ${
        on ? "border-success text-success-deep" : "border-warm-3 text-[#4A453D] hover:border-[#CFC8B8]"
      }`}
    >
      {popular && (
        <span
          className="absolute -top-1.5 -right-1.5 text-[8.5px] font-extrabold text-white rounded-full px-[6px] py-px"
          style={{ background: RAINBOW }}
        >
          인기
        </span>
      )}
      {isNew && (
        <span className="absolute -top-1.5 -right-1.5 text-[8.5px] font-extrabold text-white bg-[#9333EA] rounded-full px-[6px] py-px">
          NEW
        </span>
      )}
      {color ? (
        <span
          className="w-6 h-6 rounded-[7px] border flex items-center justify-center text-[13px]"
          style={{ background: color.bg, borderColor: color.border, color: color.text }}
        >
          {icon}
        </span>
      ) : (
        <span className="text-[17px]">{icon}</span>
      )}
      <span className="leading-tight">{label}</span>
    </Link>
  );

  if (!popular) return tile;
  return (
    <div className="rounded-[13px] p-[1.5px]" style={{ background: RAINBOW }}>
      <div className="rounded-[11.5px]">{tile}</div>
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // The streak note is a nice-to-have; fetch it lazily the first time the
  // sheet opens and stay silent when logged out or on error.
  useEffect(() => {
    if (!open || streakDays !== null) return;
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("streak_days")
        .eq("id", auth.user.id)
        .single();
      if (!cancelled && typeof data?.streak_days === "number") setStreakDays(data.streak_days);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, streakDays, supabase]);

  // Close when the route changes (e.g. browser back) — computed during
  // render (not an effect) so it doesn't trigger an extra render. Body
  // scroll lock while the sheet is up stays a real effect below.
  const [openForPathname, setOpenForPathname] = useState(pathname);
  if (pathname !== openForPathname) {
    setOpenForPathname(pathname);
    setOpen(false);
  }
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);
  const sheetSections = [{ title: "My page", items: [...MAIN_ITEMS, ACCOUNT_ITEM] }, ...SECTIONS];

  return (
    <>
      {open && (
        <button
          aria-label="Close menu"
          onClick={close}
          className="md:hidden fixed inset-0 z-40 bg-[#282319]/35 cursor-default"
        />
      )}

      <div className="md:hidden fixed left-0 right-0 bottom-0 z-50 flex flex-col">
        {open && (
          <div
            role="dialog"
            aria-label="All menus"
            className="sheet-up bg-warm border-t-[1.5px] border-dashed border-dash rounded-t-[22px] px-4 pt-2.5 pb-4 max-h-[70vh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-[#D8D0BF] mx-auto mb-1" aria-hidden="true" />

            {sheetSections.map((section) => (
              <div key={section.title}>
                <p className="text-[13px] font-black tracking-[.08em] uppercase text-success-deep px-0.5 pt-3 pb-1.5">
                  {section.title}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {section.items.map((item) => (
                    <Tile
                      key={item.href}
                      {...item}
                      on={item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)}
                      onNavigate={close}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Dark-mode toggle removed while dark mode is off — see lib/mode.ts.
                It sat here, one tap from every menu open, which is how phones
                ended up stuck in an inverted palette. */}

            {streakDays !== null && (
              <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[13px] py-[10px] mt-4 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
                <span className="text-lg">🔥</span>
                <div>
                  <b className="block text-[13px] font-semibold leading-tight">{streakDays}-day streak</b>
                  <small className="text-[11.5px] text-muted">Keep it alive today!</small>
                </div>
              </div>
            )}
          </div>
        )}

        <nav
          className="bg-white/90 backdrop-blur-[10px] border-t border-line flex justify-center gap-1 py-2 pb-[max(8px,env(safe-area-inset-bottom))]"
          aria-label="main"
        >
          {ITEMS.map((item) => {
            const on = !open && pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={close}
                className={`flex flex-col items-center gap-px rounded-lg px-[15px] py-[7px] text-[11px] font-medium transition-colors ${
                  on ? "text-charcoal" : "text-faint hover:text-muted"
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
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className={`flex flex-col items-center gap-px rounded-lg px-[15px] py-[7px] text-[11px] transition-colors ${
              open ? "text-success-deep font-bold" : "text-faint font-medium hover:text-muted"
            }`}
          >
            <span
              className="text-[17px]"
              style={open ? {} : { filter: "grayscale(1)", opacity: 0.55 }}
            >
              🌿
            </span>
            Menu
          </button>
        </nav>
      </div>
    </>
  );
}
