"use client";

import { useEffect, useState } from "react";
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
  const [growth, setGrowth] = useState<Growth | null>(null);

  useEffect(() => {
    if (!species) return;
    const stage = treeStageForLevel(level);

    const prevSpecies = localStorage.getItem("kroot-tree-species") as CefrLevel | null;
    localStorage.setItem("kroot-tree-species", species);
    const prevStage = localStorage.getItem("kroot-tree-stage") as CefrLevel | null;
    localStorage.setItem("kroot-tree-stage", stage);
    const tiers = veteranTiers(level);
    const prevTiersRaw = localStorage.getItem("kroot-tree-tiers");
    localStorage.setItem("kroot-tree-tiers", String(tiers));
    const tiersGrew = prevTiersRaw !== null && tiers > Number(prevTiersRaw);

    const speciesGrew =
      !!prevSpecies && prevSpecies !== species && LEVEL_ORDER.indexOf(species) > LEVEL_ORDER.indexOf(prevSpecies);
    const stageGrew =
      !!prevStage && prevStage !== stage && LEVEL_ORDER.indexOf(stage) > LEVEL_ORDER.indexOf(prevStage);
    if (!speciesGrew && !stageGrew && !tiersGrew) return;

    const t = setTimeout(() => {
      setGrowth({
        fromStage: prevStage ?? stage,
        toStage: stage,
        fromSpecies: prevSpecies ?? species,
        toSpecies: species,
        promoted: speciesGrew,
        grewTaller: !speciesGrew && !stageGrew && tiersGrew,
      });
    }, 500);
    return () => clearTimeout(t);
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
        aria-label="Close"
        onClick={() => setGrowth(null)}
        className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tree growth"
          className="pointer-events-auto w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)] px-8 pt-9 pb-8 text-center"
        >
          <b className="block text-[13px] font-extrabold tracking-[.08em] uppercase text-success mb-1">
            {growth.promoted ? "Promotion!" : growth.grewTaller ? "Taller!" : "Your tree grew!"}
          </b>
          <p className="text-[21px] font-extrabold text-[#221F1B] mb-4 tracking-tight">
            {growth.promoted
              ? "A brand new tree! 🌳"
              : growth.grewTaller
              ? "A new canopy tier — and a keepsake 🌲"
              : `Say hello to the ${treeName}! 🌳`}
          </p>

          <TreeEvolution
            from={growth.fromSpecies}
            to={growth.toSpecies}
            stage={growth.toStage}
            fromStage={growth.fromStage}
          />

          <p className="text-[13.5px] text-muted leading-relaxed mt-4 mb-6">
            Lv. {level} — keep watering it every day and watch how far it grows.
          </p>
          <button
            onClick={() => setGrowth(null)}
            className="w-full rounded-[13px] bg-success text-white font-bold text-[14.5px] py-3.5 hover:bg-success-deep transition-colors"
          >
            Nice!
          </button>
        </div>
      </div>
    </>
  );
}
