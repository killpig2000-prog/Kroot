"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import TreeEvolution from "@/components/level-test/TreeEvolution";
import { LEVEL_ORDER, LEVEL_PATH, type CefrLevel } from "@/lib/tree";
import { treeStageForLevel, veteranTiers } from "@/lib/level";

type Growth = {
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
// past Lv.50) or a CEFR promotion
// changing the species — with a full-screen popup instead of TreeCard's old
// quiet inline banner. Fires once per transition via a localStorage diff.
export default function TreeGrowthPopup({
  level,
  species,
}: {
  level: number;
  species?: CefrLevel;
}) {
  const t = useTranslations("dashboard.growth");
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

  useEffect(() => {
    if (!growth) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [growth]);

  if (!growth) return null;
  const treeName = LEVEL_PATH[growth.toStage].treeName;

  return (
    <>
      <button
        aria-label={t("closeAria")}
        onClick={() => setGrowth(null)}
        className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("dialogAria")}
          className="pointer-events-auto w-full max-w-[420px] bg-cream rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)] px-8 pt-9 pb-8 text-center"
        >
          <b className="block text-[13px] font-extrabold tracking-[.08em] uppercase text-success mb-1">
            {growth.promoted ? t("promotion") : growth.grewTaller ? t("taller") : t("grew")}
          </b>
          <p className="text-[21px] font-extrabold text-charcoal mb-4 tracking-tight">
            {growth.promoted
              ? t("newTree")
              : growth.grewTaller
              ? t("newTier")
              : t("sayHello", { treeName })}
          </p>

          <TreeEvolution
            from={growth.fromSpecies}
            to={growth.toSpecies}
            stage={growth.toStage}
            fromStage={growth.fromStage}
          />

          <p className="text-[13.5px] text-muted leading-relaxed mt-4 mb-6">
            {t("note", { level })}
          </p>
          <button
            onClick={() => setGrowth(null)}
            className="w-full rounded-[13px] bg-success text-white font-bold text-[14.5px] py-3.5 hover:bg-success-deep transition-colors"
          >
            {t("ok")}
          </button>
        </div>
      </div>
    </>
  );
}
