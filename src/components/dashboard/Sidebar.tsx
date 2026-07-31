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
    ],
  },
];

function NavItem({ icon, label, href, on }: { icon: string; label: string; href: string; on: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-sm transition-colors ${
        on
          ? "bg-[#F0FDF4] text-[#16A34A] font-semibold"
          : "text-[#3F3F46] font-medium hover:bg-[#F0FDF4] hover:text-[#16A34A]"
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
    <aside className="hidden md:flex flex-col gap-1 border-r border-[#E7E5E4] px-3.5 py-5 sticky top-0 h-screen overflow-y-auto">
      <Link href="/dashboard" className="flex items-center gap-[9px] font-semibold text-[17px] tracking-[-0.01em] px-2.5 pb-[18px]">
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
          <p className="text-[11px] font-bold tracking-[.07em] uppercase text-[#16A34A]/70 px-3 pt-3.5 pb-1.5">
            {section.title}
          </p>
          {section.items.map((item) => (
            <NavItem key={item.label} {...item} on={pathname.startsWith(item.href)} />
          ))}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-1">
        <div className="flex items-center gap-2.5 border border-[#FDE68A] bg-[#FFFBEB] rounded-[10px] px-[13px] py-[11px] mb-1.5">
          <span className="text-lg">🔥</span>
          <div>
            <b className="block text-[13.5px] font-semibold leading-tight">{streakDays}-day streak</b>
            <small className="text-[11.5px] text-[#71717A]">Keep it alive today!</small>
          </div>
        </div>
        <AccountMenu displayName={displayName} email={email} avatarUrl={avatarUrl} />
      </div>
    </aside>
  );
}
