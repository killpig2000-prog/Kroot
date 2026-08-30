"use client";

import { useEffect, useRef, useState } from "react";

export type RailGroup = {
  label?: string;
  items: { id: string; label: string; icon: string }[];
};

// Sticky left nav for /admin — highlights whichever section is in view.
export default function AdminRail({ groups }: { groups: RailGroup[] }) {
  const [active, setActive] = useState(groups[0]?.items[0]?.id);
  const ids = useRef(groups.flatMap((g) => g.items.map((i) => i.id)));

  useEffect(() => {
    const sections = ids.current.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-10% 0px -70% 0px" }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 h-screen border-r border-line px-3 py-[18px] flex flex-col gap-0.5 overflow-y-auto shrink-0 w-[210px]">
      <div className="flex items-center gap-2 px-2 pb-4 font-semibold text-[15px]">
        <span className="w-[9px] h-[9px] rounded-[3px] bg-success inline-block" />
        Kroot 관리자
      </div>
      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && <div className="text-[10px] font-black tracking-[.09em] uppercase text-faint px-2.5 pt-3.5 pb-1">{g.label}</div>}
          {g.items.map((it) => (
            <a
              key={it.id}
              href={`#${it.id}`}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-[9px] text-[12.5px] font-bold no-underline transition-colors ${
                active === it.id ? "bg-success-bg text-success-deep" : "text-muted hover:bg-warm hover:text-charcoal"
              }`}
            >
              {it.icon} {it.label}
            </a>
          ))}
        </div>
      ))}
      <div className="mt-auto pt-2.5 border-t border-line text-[11px] text-faint px-2.5 pt-2.5">
        본인 전용 · service role
      </div>
    </nav>
  );
}
