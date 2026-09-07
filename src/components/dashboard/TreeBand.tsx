"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { treeStageForLevel, MAX_LEVEL } from "@/lib/level";
import type { CefrLevel } from "@/lib/tree";

// The Garden page's one line about the tree (2026-09-07 restructure): a
// small tree, the level, the XP bar, the streak and the coins — tap it and
// you're in My room, where the full garden (bubble, avatar, growth stages)
// lives now. The home page is about what to do today, not the tree.
export default function TreeBand({
  level,
  progressPct,
  costumeIds = [],
  species,
  streakDays,
  coins,
}: {
  level: number;
  progressPct: number;
  costumeIds?: string[];
  species?: CefrLevel;
  streakDays: number;
  coins: number;
}) {
  const t = useTranslations("dashboard.tree");
  const ti = useTranslations("profile.identity");
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFill(progressPct), 200);
    return () => clearTimeout(timer);
  }, [progressPct]);
  const stage = treeStageForLevel(level);

  return (
    <Link
      href="/myroom"
      data-tour="tree"
      aria-label={t("openMyRoom")}
      className="flex items-center gap-2.5 border border-line rounded-[14px] px-3 py-2 mb-3 transition-all hover:-translate-y-0.5 hover:border-success"
      style={{ background: "linear-gradient(to right, #DFF0E6, var(--c-card, #FFFDF6) 70%)" }}
    >
      <svg viewBox="0 0 220 230" className="flex-none h-auto" style={{ width: "clamp(30px, 8vw, 36px)" }} aria-hidden="true">
        <LevelCreature level={stage} costumeIds={costumeIds} species={species} />
      </svg>
      <span className="flex-none text-[13px] font-extrabold text-charcoal tabular-nums">{t("levelBadge", { level })}</span>
      <span className="flex-1 min-w-0 h-[6px] rounded-full overflow-hidden bg-line">
        <i
          className="not-italic block h-full rounded-full bg-success transition-[width] duration-1000"
          style={{ width: `${level >= MAX_LEVEL ? 100 : fill}%` }}
        />
      </span>
      <span className="flex-none text-[12px] font-bold text-muted tabular-nums" aria-label={ti("streak", { n: streakDays })}>
        🔥 {streakDays}
      </span>
      <span className="flex-none text-[12px] font-bold text-muted tabular-nums" aria-label={ti("coins", { n: coins })}>
        🪙 {coins}
      </span>
      <span className="flex-none text-[13px] text-muted" aria-hidden="true">›</span>
    </Link>
  );
}
