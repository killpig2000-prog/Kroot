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
      // sizes are the restructure mockup's, scaled 1.45× from its 268px
      // phone frame to a real 390px one (2026-09-07 fidelity pass)
      className="flex items-center gap-[11px] border border-line rounded-[20px] px-[14px] py-[10px] mb-3 transition-all hover:-translate-y-0.5 hover:border-success"
      style={{ background: "linear-gradient(to right, #DFF0E6, var(--c-card, #FFFDF6) 70%)" }}
    >
      <svg viewBox="0 0 220 230" className="flex-none h-auto" style={{ width: "clamp(40px, 11vw, 48px)" }} aria-hidden="true">
        <LevelCreature level={stage} costumeIds={costumeIds} species={species} />
      </svg>
      <span className="flex-none text-[17px] font-extrabold text-charcoal tabular-nums">{t("levelBadge", { level })}</span>
      <span className="flex-1 min-w-0 h-[9px] rounded-full overflow-hidden bg-line">
        <i
          className="not-italic block h-full rounded-full bg-success transition-[width] duration-1000"
          style={{ width: `${level >= MAX_LEVEL ? 100 : fill}%` }}
        />
      </span>
      <span className="flex-none text-[14.5px] font-bold text-muted tabular-nums" aria-label={ti("streak", { n: streakDays })}>
        🔥 {streakDays}
      </span>
      <span className="flex-none text-[14.5px] font-bold text-muted tabular-nums" aria-label={ti("coins", { n: coins })}>
        🪙 {coins}
      </span>
      <span className="flex-none text-[15px] text-muted" aria-hidden="true">›</span>
    </Link>
  );
}
