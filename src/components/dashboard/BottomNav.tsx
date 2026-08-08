"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { applyModeToDocument, type ModeKey } from "@/lib/mode";
import { MAIN_ITEMS, SECTIONS } from "@/components/dashboard/navItems";

const ITEMS = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
  { icon: "📊", label: "Growth", href: "/profile" },
  { icon: "🏕️", label: "Friends", href: "/community" },
  { icon: "🛍️", label: "Shop", href: "/shop" },
];

function Tile({ icon, label, href, on, onNavigate }: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex flex-col items-center gap-0.5 rounded-[12px] border bg-white px-1 py-2 text-center text-[11px] font-bold transition-colors ${
        on ? "border-[#16A34A] text-[#15803D]" : "border-[#EFE9DC] text-[#4A453D] hover:border-[#CFC8B8]"
      }`}
    >
      <span className="text-[17px]">{icon}</span>
      <span className="leading-tight">{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [streakDays, setStreakDays] = useState<number | null>(null);
  // Mirrors AccountMenu (desktop sidebar): initial value comes off the <html>
  // attribute the layout rendered from the kroot-mode cookie.
  const [mode, setMode] = useState<ModeKey>(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-mode") === "dark"
      ? "dark"
      : "light",
  );
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

  // Close when the route changes (e.g. browser back) and lock body scroll
  // while the sheet is up.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);
  const toggleMode = () => {
    const next: ModeKey = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyModeToDocument(next);
  };
  const sheetSections = [{ title: "My page", items: MAIN_ITEMS }, ...SECTIONS];

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
            className="sheet-up bg-[#FAF7EF] border-t-[1.5px] border-dashed border-[#DDD6C8] rounded-t-[22px] px-4 pt-2.5 pb-4 max-h-[70vh] overflow-y-auto"
          >
            <div className="w-10 h-1 rounded-full bg-[#D8D0BF] mx-auto mb-1" aria-hidden="true" />

            {sheetSections.map((section) => (
              <div key={section.title}>
                <p className="text-[11px] font-extrabold tracking-[.1em] uppercase text-[#B7AE9C] px-0.5 pt-3 pb-1.5">
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

            <button
              onClick={toggleMode}
              className="w-full flex items-center justify-between rounded-[12px] border border-[#EFE9DC] bg-white px-3.5 py-2.5 mt-4 text-[13px] font-semibold text-[#4A453D]"
            >
              <span>{mode === "dark" ? "🌙 Dark mode" : "☀️ Light mode"}</span>
              <span
                className={`w-9 h-5 rounded-full relative transition-colors ${
                  mode === "dark" ? "bg-[#16A34A]" : "bg-[#E3DDD0]"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                    mode === "dark" ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </span>
            </button>

            {streakDays !== null && (
              <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[13px] py-[10px] mt-4 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
                <span className="text-lg">🔥</span>
                <div>
                  <b className="block text-[13px] font-semibold leading-tight">{streakDays}-day streak</b>
                  <small className="text-[11.5px] text-[#6B6560]">Keep it alive today!</small>
                </div>
              </div>
            )}
          </div>
        )}

        <nav
          className="bg-white/90 backdrop-blur-[10px] border-t border-[#E3DDD0] flex justify-center gap-1 py-2 pb-[max(8px,env(safe-area-inset-bottom))]"
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
                  on ? "text-[#18181B]" : "text-[#A19A8C] hover:text-[#6B6560]"
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
              open ? "text-[#15803D] font-bold" : "text-[#A19A8C] font-medium hover:text-[#6B6560]"
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
