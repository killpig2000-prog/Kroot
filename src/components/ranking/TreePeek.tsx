"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import LevelCreature from "@/components/dashboard/LevelCreature";
import GrowthRing from "@/components/dashboard/GrowthRing";
import { treeStageForLevel } from "@/lib/level";
import { SceneLayer, skyFor } from "@/lib/costumes";
import type { WeekRing } from "@/lib/growth-rings";
import type { CefrLevel } from "@/lib/tree";

// Tapping a tree — on the ranking, or your own in My room — opens the whole
// thing. Two halves (2026-09-11, user's layout): the tree on the left, and on
// the right a large growth ring above whose it is. The stage is a fixed
// height and the tree's 220x230 frame scales to fit it.
//
// Rings are optional: My room has the learner's own twelve weeks; the
// ranking passes them once the board's RPC returns other gardeners' weeks.

export default function TreePeek({
  name,
  rank,
  avatarUrl,
  level,
  xpWeek,
  species,
  costumeIds,
  isMe,
  rings,
  onClose,
}: {
  name: string;
  rank?: number;
  avatarUrl: string | null;
  level: number;
  xpWeek?: number;
  species: CefrLevel;
  costumeIds: string[];
  isMe: boolean;
  /** newest first, [0] the current week; `today` 0 = Monday */
  rings?: { weeks: WeekRing[]; today: number };
  onClose: () => void;
}) {
  const t = useTranslations("ranking");
  const tr = useTranslations("dashboard.rings");
  const sky = skyFor(costumeIds);
  const grown = rings ? rings.weeks.filter((w) => w.attended > 0).length : 0;

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
          className="pointer-events-auto relative w-full max-w-[440px] bg-cream rounded-[20px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.4)] p-3 grid grid-cols-2 gap-3"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t("peek.close")}
            className="absolute top-2 right-2 z-[2] w-8 h-8 rounded-full bg-warm/90 text-muted hover:text-charcoal text-[15px] leading-none"
          >
            ✕
          </button>

          {/* ── left: the tree, full height of the card ── */}
          <div
            className="rounded-[16px] border border-success-line flex items-end justify-center overflow-hidden min-h-[240px]"
            style={{ background: sky ?? "linear-gradient(180deg, #EAF6FF 0%, #EAF3EC 70%)" }}
          >
            <svg viewBox="0 0 220 230" className="h-full w-auto max-w-full" aria-hidden="true">
              <SceneLayer costumeIds={costumeIds} layer="behind" />
              <LevelCreature level={treeStageForLevel(level)} playerLevel={level} costumeIds={costumeIds} species={species} />
              <SceneLayer costumeIds={costumeIds} layer="front" />
            </svg>
          </div>

          {/* ── right: a big growth ring over who ── */}
          <div className="min-w-0 flex flex-col gap-2.5">
            {rings && (
              <>
                <div className="flex flex-col items-center text-center gap-1.5 pt-7">
                  <GrowthRing
                    week={rings.weeks[0]?.days ?? [0, 0, 0, 0, 0, 0, 0]}
                    today={rings.today}
                    past={rings.weeks.slice(1)}
                    ring="sheet"
                    level={level}
                    className="flex-none"
                    style={{ width: "clamp(112px, 30vw, 168px)", height: "clamp(112px, 30vw, 168px)" }}
                    label={tr("ariaWeek", { n: rings.weeks[0]?.attended ?? 0 })}
                  />
                  <span className="min-w-0">
                    <b className="block text-[12.5px] font-bold text-success-deep">{tr("title")}</b>
                    <span className="block text-[11.5px] text-muted tabular-nums leading-tight">
                      {grown > 1 ? tr("grown", { n: grown }) : tr("firstWeek")}
                    </span>
                  </span>
                </div>
                <div className="border-t border-line" />
              </>
            )}

            <div className="mt-auto flex items-center gap-2 min-w-0">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full border border-line object-cover flex-none" />
              ) : (
                <span className="w-9 h-9 rounded-full bg-success-bg border border-success-line grid place-items-center text-[14px] font-black text-success-deep flex-none">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0">
                <b className="block text-[14px] truncate leading-tight">
                  {rank !== undefined && (
                    <span className="inline-grid place-items-center min-w-[22px] h-[20px] px-1.5 mr-1 rounded-full bg-[var(--tint-amber)] border border-amber-line text-[11px] font-black text-[#B7791F] tabular-nums align-[-3px]">
                      #{rank}
                    </span>
                  )}
                  {name}
                  {isMe && <span className="text-success text-[11px] font-bold ml-1">{t("row.you")}</span>}
                </b>
                <span className="block text-[11.5px] text-muted tabular-nums leading-tight">
                  {t("row.level", { n: level })}
                  {xpWeek !== undefined && <> · {t("fair.sun", { n: xpWeek })}</>}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
