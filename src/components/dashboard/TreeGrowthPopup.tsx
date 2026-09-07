"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import TreeEvolution from "@/components/level-test/TreeEvolution";
import GardenScene from "@/components/ui/GardenScene";
import { LEVEL_ORDER, LEVEL_PATH, type CefrLevel } from "@/lib/tree";
import { treeStageForLevel, veteranTiers } from "@/lib/level";

export type Growth = {
  fromStage: CefrLevel;
  toStage: CefrLevel;
  fromSpecies: CefrLevel;
  toSpecies: CefrLevel;
  promoted: boolean;
  /** Lv.50+: a new canopy tier (and keepsake) rather than a new stage. */
  grewTaller: boolean;
};

// Celebrates the tree getting visibly bigger — either a numeric level
// crossing into the next growth stage (every 10 levels, or a new canopy tier
// past Lv.50) or a CEFR promotion changing the species. Fires once per
// transition via a localStorage diff; the scene itself is GrowthDialog.
export default function TreeGrowthPopup({
  level,
  species,
}: {
  level: number;
  species?: CefrLevel;
}) {
  const [growth, setGrowth] = useState<Growth | null>(null);

  useEffect(() => {
    if (!species) return;
    const stage = treeStageForLevel(level);

    const tiers = veteranTiers(level);

    // This runs on the dashboard — the first screen after signing in. Safari's
    // private mode, a browser set to block site data, and a full quota all
    // make setItem throw, and an unguarded throw here takes the whole page
    // down through the error boundary. Treat storage being unavailable as
    // "no previous milestone recorded": the celebration silently doesn't fire,
    // which is the right way for an animation to fail.
    let prevSpecies: CefrLevel | null = null;
    let prevStage: CefrLevel | null = null;
    let prevTiersRaw: string | null = null;
    try {
      prevSpecies = localStorage.getItem("kroot-tree-species") as CefrLevel | null;
      prevStage = localStorage.getItem("kroot-tree-stage") as CefrLevel | null;
      prevTiersRaw = localStorage.getItem("kroot-tree-tiers");
      localStorage.setItem("kroot-tree-species", species);
      localStorage.setItem("kroot-tree-stage", stage);
      localStorage.setItem("kroot-tree-tiers", String(tiers));
    } catch {
      return;
    }

    const tiersGrew = prevTiersRaw !== null && tiers > Number(prevTiersRaw);

    const speciesGrew =
      !!prevSpecies && prevSpecies !== species && LEVEL_ORDER.indexOf(species) > LEVEL_ORDER.indexOf(prevSpecies);
    const stageGrew =
      !!prevStage && prevStage !== stage && LEVEL_ORDER.indexOf(stage) > LEVEL_ORDER.indexOf(prevStage);
    if (!speciesGrew && !stageGrew && !tiersGrew) return;

    const timer = setTimeout(() => {
      setGrowth({
        fromStage: prevStage ?? stage,
        toStage: stage,
        fromSpecies: prevSpecies ?? species,
        toSpecies: species,
        promoted: speciesGrew,
        grewTaller: !speciesGrew && !stageGrew && tiersGrew,
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [level, species]);

  if (!growth) return null;
  return <GrowthDialog growth={growth} level={level} onClose={() => setGrowth(null)} />;
}

// The evolution moment as a night garden: the sky darkens, light gathers
// where the tree stands, the old form glows away and the new one bounces in
// (TreeEvolution). Full-screen on phones; a centred 480px dialog on wider
// screens — a whole monitor of night sky around one small sprout reads as
// empty, the dashboard behind it dimmed is enough.
export function GrowthDialog({ growth, level, onClose }: { growth: Growth; level: number; onClose: () => void }) {
  const t = useTranslations("dashboard.growth");

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const treeName = LEVEL_PATH[growth.toStage].treeName;
  const nextStage = LEVEL_ORDER[LEVEL_ORDER.indexOf(growth.toStage) + 1];

  return (
    <>
      <button aria-label={t("closeAria")} onClick={onClose} className="fixed inset-0 z-[60] bg-[#282319]/55 cursor-default" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center sm:px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("dialogAria")}
          className="pointer-events-auto flex flex-col w-full h-full sm:h-auto sm:max-w-[480px] bg-cream sm:rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.45)] overflow-hidden"
          style={{ animation: "fadeUp .4s ease" }}
        >
          <GardenScene tone="night" className="flex-1 sm:flex-none sm:h-[400px] min-h-[380px]" hillsHeight="34%">
            <div className="absolute left-0 right-0 top-[max(26px,env(safe-area-inset-top))] text-center px-6 z-[4]">
              <b className="block text-[11.5px] font-extrabold tracking-[.12em] uppercase" style={{ color: "#CFE9D6" }}>
                {growth.promoted ? t("promotion") : growth.grewTaller ? t("taller") : t("grew")}
              </b>
              <p className="text-[clamp(19px,5vw,22px)] font-extrabold tracking-tight mt-1.5" style={{ color: "#FFFDF6", textWrap: "balance" }}>
                {growth.promoted ? t("newTree") : growth.grewTaller ? t("newTier") : t("sayHello", { treeName })}
              </p>
            </div>
            <div className="absolute left-0 right-0 bottom-3 z-[4] text-center">
              <TreeEvolution from={growth.fromSpecies} to={growth.toSpecies} stage={growth.toStage} fromStage={growth.fromStage} />
            </div>
          </GardenScene>
          <div className="px-6 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] text-center">
            <p className="text-[13.5px] text-muted leading-relaxed mb-4">{t("note", { level })}</p>
            <button
              onClick={onClose}
              className="w-full rounded-[13px] bg-success text-white font-bold text-[14.5px] py-3.5 hover:bg-success-deep transition-colors"
            >
              {t("ok")}
            </button>
            {!growth.promoted && !growth.grewTaller && nextStage && (
              <p className="text-[11.5px] font-bold text-faint mt-2.5">
                {LEVEL_PATH[nextStage].icon} {LEVEL_PATH[nextStage].treeName} · Lv.{(LEVEL_ORDER.indexOf(nextStage)) * 10}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
