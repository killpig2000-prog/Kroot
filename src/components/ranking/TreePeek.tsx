"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import LevelCreature from "@/components/dashboard/LevelCreature";
import VeteranTree, { BASE_HEIGHT, VETERAN_MILESTONES, veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import { FULLY_GROWN_LEVEL, treeHeightMetres, treeStageForLevel } from "@/lib/level";
import { SceneLayer, skyFor } from "@/lib/costumes";
import type { CefrLevel } from "@/lib/tree";

// Tapping a tree on the ranking opens the whole thing: a Lv.50+ tree grows
// past any thumbnail, so the row shows the crown and this shows the tree.
// The frame is fixed and the SVG scales to fit — a taller tree draws smaller,
// which is what makes "look how tall theirs is" readable at a glance.
export default function TreePeek({
  name,
  level,
  xpWeek,
  species,
  costumeIds,
  isMe,
  onClose,
}: {
  name: string;
  level: number;
  xpWeek: number;
  species: CefrLevel;
  costumeIds: string[];
  isMe: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("ranking");
  const tk = useTranslations("dashboard.tree.keepsakes");
  const veteran = level >= FULLY_GROWN_LEVEL;
  const frameH = veteran ? veteranFrameHeight(level) : BASE_HEIGHT;
  const sky = skyFor(costumeIds);
  const earned = VETERAN_MILESTONES.filter((m) => m.level <= level);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <>
      <button aria-label={t("peek.close")} onClick={onClose} className="fixed inset-0 z-[60] bg-[#282319]/50 cursor-default" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="pointer-events-auto w-full max-w-[360px] bg-cream rounded-[22px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.4)] overflow-hidden"
        >
          <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0">
              <b className="block text-[16px] truncate">
                {name}
                {isMe && <span className="text-success text-[11.5px] font-bold ml-1.5">{t("row.you")}</span>}
              </b>
              <span className="text-[12.5px] text-muted tabular-nums">
                {t("row.level", { n: level })} · {t("fair.sun", { n: xpWeek })}
                {veteran && <> · {t("peek.height", { m: treeHeightMetres(level) })}</>}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("peek.close")}
              className="flex-none w-8 h-8 rounded-full bg-warm text-muted hover:text-charcoal text-[15px] leading-none"
            >
              ✕
            </button>
          </div>

          {/* fixed-height stage; the SVG keeps its aspect and fits inside */}
          <div
            className="mx-5 rounded-[16px] border border-success-line flex items-end justify-center overflow-hidden"
            style={{ height: "min(62vh, 520px)", background: sky ?? "linear-gradient(180deg, #EAF6FF 0%, #EAF3EC 70%)" }}
          >
            <svg viewBox={`0 0 220 ${frameH}`} className="h-full w-auto max-w-full" aria-hidden="true">
              <SceneLayer costumeIds={costumeIds} layer="behind" />
              {veteran ? (
                <VeteranTree level={level} species={species} costumeIds={costumeIds} />
              ) : (
                <LevelCreature level={treeStageForLevel(level)} costumeIds={costumeIds} species={species} />
              )}
              <SceneLayer costumeIds={costumeIds} layer="front" />
            </svg>
          </div>

          <div className="px-5 pt-3 pb-4">
            {earned.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {earned.map((m) => (
                  <span
                    key={m.level}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-line bg-[var(--tint-amber)] px-2.5 py-1 text-[11.5px] font-bold text-[#B7791F]"
                  >
                    <span className="kr">{m.kr}</span>
                    <span className="opacity-70">{tk(String(m.level))}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[12.5px] text-faint">{t("peek.noKeepsakes", { level: FULLY_GROWN_LEVEL + 10 })}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
