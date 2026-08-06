"use client";

import Link from "next/link";
import AccountMenu from "@/components/dashboard/AccountMenu";
import { usePathname } from "next/navigation";

const MAIN_ITEMS = [
  { icon: "🏡", label: "Garden", href: "/dashboard" },
  { icon: "📊", label: "My growth", href: "/profile" },
];

const SECTIONS: { title: string; items: { icon: string; label: string; href: string }[] }[] = [
  {
    title: "Basics",
    items: [
      { icon: "🧭", label: "16-Day Course", href: "/course" },
      { icon: "🔤", label: "Hangul", href: "/hangul" },
      { icon: "📖", label: "Grammar", href: "/grammar" },
      { icon: "🔊", label: "Pronunciation", href: "/pronunciation" },
      { icon: "🃏", label: "Vocabulary", href: "/vocabulary" },
    ],
  },
  {
    title: "Practice",
    items: [
      { icon: "🎧", label: "Listening", href: "/listening" },
      { icon: "🎙️", label: "Speaking", href: "/speaking" },
      { icon: "✏️", label: "Writing", href: "/writing" },
      { icon: "📰", label: "Reading", href: "/reading" },
    ],
  },
  {
    title: "Relax",
    items: [
      { icon: "🏆", label: "League", href: "/league" },
      { icon: "💬", label: "Slang", href: "/slang" },
      { icon: "🏕️", label: "Community", href: "/community" },
      { icon: "🛍️", label: "Shop", href: "/shop" },
      { icon: "🌟", label: "Kroot Plus", href: "/pricing" },
    ],
  },
];

function NavItem({ icon, label, href, on }: { icon: string; label: string; href: string; on: boolean }) {
  // Active item reads like a notebook index tab: white paper, dashed edge,
  // open on the right so it "connects" to the page.
  return (
    <Link
      href={href}
      className={`flex items-center gap-[11px] px-3 py-2.5 text-sm transition-colors ${
        on
          ? "bg-white border border-dashed border-[#CFC8B8] border-r-0 rounded-l-[10px] -mr-3.5 text-[#15803D] font-bold"
          : "rounded-[9px] text-[#4A453D] font-medium hover:bg-white hover:text-[#15803D]"
      }`}
    >
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );
}

export default function Sidebar({
  displayName,
  email,
  streakDays,
  avatarUrl,
}: {
  displayName: string;
  email: string;
  streakDays: number;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col gap-1 border-r border-dashed border-[#DDD6C8] bg-[#FAF7EF] px-3.5 py-5 sticky top-0 h-screen overflow-y-auto">
      <Link href="/dashboard" className="flex items-center gap-[9px] font-extrabold text-[17px] tracking-[-0.01em] px-2.5 pb-[18px] text-[#221F1B]">
        <span className="w-[30px] h-[30px] rounded-lg bg-[#16A34A] flex items-center justify-center kr text-sm text-white">
          한
        </span>
        Kroot
      </Link>

      {MAIN_ITEMS.map((item) => (
        <NavItem key={item.label} {...item} on={pathname === item.href} />
      ))}

      {SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="text-[11px] font-extrabold tracking-[.1em] uppercase text-[#B7AE9C] px-3 pt-3.5 pb-1.5">
            {section.title}
          </p>
          {section.items.map((item) => (
            <NavItem key={item.label} {...item} on={pathname.startsWith(item.href)} />
          ))}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-center gap-2.5 border border-[#ECD98A] bg-[#FEF9C3] px-[13px] py-[11px] mb-1.5 rotate-[-1deg] shadow-[0_8px_18px_-12px_rgba(120,100,30,.4)]">
          <span className="text-lg">🔥</span>
          <div>
            <b className="block text-[13.5px] font-semibold leading-tight">{streakDays}-day streak</b>
            <small className="text-[11.5px] text-[#6B6560]">Keep it alive today!</small>
          </div>
        </div>
        <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </aside>
  );
}
