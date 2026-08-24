"use client";

import { useEffect, useState } from "react";
import LevelCreature from "@/components/dashboard/LevelCreature";
import { SPECIES, type CefrLevel } from "@/lib/tree";

// The promotion moment: the old species glows away and the new one bounces
// in. Reduced-motion users jump straight to the new tree.
export default function TreeEvolution({
  from,
  to,
  stage,
  fromStage,
}: {
  from: CefrLevel;
  to: CefrLevel;
  /** Growth stage (player level band) for the new creature. */
  stage: CefrLevel;
  /** Growth stage for the outgoing creature, if it's also growing bigger — defaults to `stage`. */
  fromStage?: CefrLevel;
}) {
  const [phase, setPhase] = useState<"old" | "flash" | "new">("old");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => setPhase("new"), 0);
      return () => clearTimeout(t);
    }
    const t1 = setTimeout(() => setPhase("flash"), 1300);
    const t2 = setTimeout(() => setPhase("new"), 1900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="w-[min(230px,70vw)] mx-auto">
      <svg viewBox="0 0 220 230" className="w-full h-auto overflow-visible" aria-hidden="true">
        {phase === "new" ? (
          <>
            <g fontSize="20">
              <text className="confetti-pop" x="14" y="180">🎊</text>
              <text className="confetti-pop d2" x="100" y="205">✨</text>
              <text className="confetti-pop d3" x="182" y="180">🎉</text>
            </g>
            <g className="evolve-in">
              <LevelCreature level={stage} species={to} />
            </g>
          </>
        ) : (
          <>
            <g className={phase === "flash" ? "evolve-out" : "sway"}>
              <LevelCreature level={fromStage ?? stage} species={from} />
            </g>
            {phase === "flash" && (
              <circle className="evolve-glow" cx="110" cy="130" r="86" fill="#FDE68A" opacity="0" />
            )}
          </>
        )}
      </svg>
      <p
        className="text-[13.5px] text-[#6B6560] mt-1"
        style={{ visibility: phase === "new" ? "visible" : "hidden" }}
      >
        <span className="kr font-semibold">{SPECIES[from].krName}</span>
        <span aria-hidden="true"> → </span>
        <span className="kr font-bold text-[#16A34A]">{SPECIES[to].krName}</span>{" "}
        <span aria-hidden="true">{SPECIES[to].emoji}</span>
      </p>
    </div>
  );
}
