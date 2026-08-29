"use client";

import { useEffect, useState } from "react";
import AccountMenu from "@/components/dashboard/AccountMenu";
import { Link, usePathname } from "@/i18n/navigation";
import { MAIN_ITEMS, SECTIONS, type NavColor } from "@/components/dashboard/navItems";
import BrandMark from "@/components/ui/BrandMark";

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
  // Active item reads like a notebook index tab: white paper, dashed edge,
  // open on the right so it "connects" to the page.
  const link = (
    <Link
      href={href}
      className={`flex items-center gap-2 px-2.5 py-2 text-[13.5px] transition-colors ${
        on
          ? "bg-cream border border-dashed border-[#CFC8B8] border-r-0 rounded-l-[10px] -mr-3.5 text-success-deep font-bold"
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
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {popular && (
        <span
          className="flex-none text-[8.5px] font-extrabold tracking-[.02em] text-white rounded-full px-[5px] py-px"
          style={{ background: "linear-gradient(90deg,#F43F5E,#F59E0B,#22C55E,#0EA5E9,#8B5CF6)" }}
        >
          Popular
        </span>
      )}
      {isNew && !on && (
        <span className="flex-none text-[8.5px] font-extrabold tracking-[.04em] text-white bg-[#9333EA] rounded-full px-[5px] py-px">
          NEW
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

type Props = {
  displayName: string;
  email: string;
  streakDays: number;
  avatarUrl?: string | null;
  /** Active Kroot Plus — shows the streak shield note. */
  plus?: boolean;
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

// The nav body — one source for the desktop column and the phone drawer, so
// the two never drift apart (same order, icons, badges, streak note, account).
function SidebarBody({
  displayName,
  email,
  streakDays,
  avatarUrl,
  plus = false,
  streakFreezes = 0,
  pathname,
  onClose,
}: Props & { pathname: string; onClose?: () => void }) {
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
            {section.title}
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
            <b className="block text-[13.5px] font-semibold leading-tight text-[#5C4A0E]">{streakDays}-day streak</b>
            <small className="text-[11.5px] text-[#8A7420]">
              {plus && streakFreezes > 0
                ? `🛡️ Plus · 🧊 ${streakFreezes} freeze${streakFreezes === 1 ? "" : "s"}`
                : plus
                  ? "🛡️ Shielded by Plus"
                  : streakFreezes > 0
                    ? `🧊 ${streakFreezes} freeze${streakFreezes === 1 ? "" : "s"} ready`
                    : "Keep it alive today!"}
            </small>
          </div>
        </div>
        <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </>
  );
}

export default function Sidebar(props: Props) {
  const pathname = usePathname();
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
        <SidebarBody {...props} pathname={pathname} />
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
        <Link
          href="/profile"
          aria-label={`${props.streakDays}-day streak`}
          className="flex items-center gap-1 h-8 px-2.5 rounded-full border border-[#ECD98A] bg-[#FEF9C3] text-[#5C4A0E] text-[12.5px] font-bold tabular-nums"
        >
          🔥 {props.streakDays}
        </Link>
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
        <SidebarBody {...props} pathname={pathname} onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
