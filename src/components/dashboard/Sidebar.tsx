"use client";

import Link from "next/link";
import AccountMenu from "@/components/dashboard/AccountMenu";
import { usePathname } from "next/navigation";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";

function NavItem({
  icon,
  label,
  href,
  on,
  color,
  popular,
}: {
  icon: string;
  label: string;
  href: string;
  on: boolean;
  color?: NavColor;
  popular?: boolean;
}) {
  // Active item reads like a notebook index tab: white paper, dashed edge,
  // open on the right so it "connects" to the page.
  const link = (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2.5 py-2 text-[13.5px] transition-colors ${
        on
          ? "bg-white border border-dashed border-[#CFC8B8] border-r-0 rounded-l-[10px] -mr-3.5 text-success-deep font-bold"
          : "rounded-[9px] text-[#4A453D] font-medium hover:bg-white hover:text-success-deep"
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
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {popular && (
        <span
          className="flex-none text-[8.5px] font-extrabold tracking-[.02em] text-white rounded-full px-[5px] py-px"
          style={{ background: "linear-gradient(90deg,#F43F5E,#F59E0B,#22C55E,#0EA5E9,#8B5CF6)" }}
        >
          인기
        </span>
      )}
    </Link>
  );

  // Skip the ring once the item is active — the "notebook tab" active state
  // (white bg, right edge bled off with a negative margin) doesn't fit
  // inside the ring's rounded frame, and the highlight is redundant once
  // you're already on that page.
  if (!popular || on) return link;

  // Rainbow-ring treatment: a gradient frame with a small padding gap, only
  // for the one item we want to visually call out (Pronunciation).
  return (
    <div className="rounded-[11px] p-[1.5px]" style={{ background: "linear-gradient(90deg,#F43F5E,#F59E0B,#22C55E,#0EA5E9,#8B5CF6)" }}>
      <div className="rounded-[9.5px] bg-warm">{link}</div>
    </div>
  );
}

export default function Sidebar({
  displayName,
  email,
  streakDays,
  avatarUrl,
  plus = false,
}: {
  displayName: string;
  email: string;
  streakDays: number;
  avatarUrl?: string | null;
  /** Active Kroot Plus — shows the streak shield note. */
  plus?: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col gap-1 border-r border-dashed border-dash bg-warm px-3.5 py-5 sticky top-0 h-screen overflow-y-auto">
      <Link href="/dashboard" className="flex items-center gap-[9px] font-extrabold text-[17px] tracking-[-0.01em] px-2.5 pb-[18px] text-[#221F1B]">
        <span className="w-[30px] h-[30px] rounded-lg bg-success flex items-center justify-center kr text-sm text-white">
          한
        </span>
        Kroot
      </Link>

      {MAIN_ITEMS.map((item) => (
        <NavItem key={item.label} {...item} on={pathname === item.href} />
      ))}

      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="text-[13px] font-extrabold tracking-[.08em] uppercase text-success-deep px-3 pt-3.5 pb-1.5">
            {section.title}
          </p>
          <div className="flex flex-col gap-1.5">
            {section.items.map((item) => (
              <NavItem key={item.label} {...item} on={pathname.startsWith(item.href)} />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[13px] py-[11px] mb-1.5 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
          <span className="text-lg">🔥</span>
          <div>
            <b className="block text-[13.5px] font-semibold leading-tight">{streakDays}-day streak</b>
            <small className="text-[11.5px] text-muted">
              {plus ? "🛡️ Shielded by Plus" : "Keep it alive today!"}
            </small>
          </div>
        </div>
        <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </aside>
  );
}
