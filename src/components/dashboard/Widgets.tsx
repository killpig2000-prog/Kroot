"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export type SlangTeaser = {
  kr: string;
  romanization: string;
  meaning: string;
};

const TAPE = { background: "rgba(190,227,248,.65)", borderColor: "rgba(150,200,230,.45)" };

function WCard({ title, tag, children }: { title: string; tag: string; children: React.ReactNode }) {
  // A note taped to the rail.
  return (
    <div className="relative bg-cream border border-line px-[18px] py-4 shadow-[0_10px_22px_-14px_rgba(60,50,30,.3)] rotate-[0.8deg]">
      <span
        aria-hidden="true"
        className="absolute -top-2 left-1/2 -translate-x-1/2 -rotate-2 w-[46px] h-[15px] border z-10"
        style={TAPE}
      />
      <div className="flex items-baseline justify-between mb-3">
        <b className="text-[12px] font-extrabold tracking-[.05em] text-success-deep uppercase">{title}</b>
        <small className="text-[11.5px] text-faint">{tag}</small>
      </div>
      {children}
    </div>
  );
}

// Weekly grass, the monthly ring and Today's quest all used to live here and
// were folded into the main column one by one. The word of the day was
// dropped altogether (2026-09-07, user decision — the dashboard is for
// today's one thing, not a second daily snack). Today's slang stays here on
// xl+ and inline in the main column below that.
export default function Widgets({ slang }: { slang?: SlangTeaser | null }) {
  const t = useTranslations("dashboard");
  if (!slang) return null;
  return (
    <aside className="hidden xl:flex flex-col gap-5 border-l border-dashed border-dash bg-warm px-5 py-[26px] sticky top-0 h-screen overflow-y-auto">
      <WCard title={t("slang.title")} tag="💬">
        <Link href="/slang" className="block group">
          <p className="kr text-[21px] font-bold text-[var(--tint-pink-ink-deep)] mb-0.5">
            {slang.kr}{" "}
            <span className="text-[12px] font-medium text-[var(--tint-pink-ink)]">({slang.romanization})</span>
          </p>
          <p className="text-[12.5px] text-muted mb-2">{slang.meaning}</p>
          <span className="text-[12.5px] font-semibold text-[var(--tint-pink-ink)] transition-transform inline-block group-hover:translate-x-0.5">
            {t("slang.flip")}
          </span>
        </Link>
      </WCard>
    </aside>
  );
}
