"use client";

import { useEffect, useState } from "react";
import { LEVEL_ORDER, LEVEL_PATH } from "@/lib/tree";
import { MAX_LEVEL, treeStageForLevel } from "@/lib/level";
import SpeechBubble from "@/components/ui/SpeechBubble";
import LevelCreature from "@/components/dashboard/LevelCreature";

const TREE_PHRASES = [
  { kr: "화이팅!", en: "you got this!" },
  { kr: "오늘도 좋아요!", en: "looking good today!" },
  { kr: "물 줘서 고마워요", en: "thanks for the water" },
  { kr: "같이 자라요", en: "let's grow together" },
];

// One label per 5-level tree stage.
const STAGE_RANGES = ["1-5", "6-10", "11-15", "16-20", "21-25", "26-30"];

export default function TreeCard({
  level,
  progressPct,
  xpInto,
  xpNeeded,
  costumeIds = [],
}: {
  level: number;
  progressPct: number;
  xpInto: number;
  xpNeeded: number;
  costumeIds?: string[];
}) {
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFill(progressPct), 200);
    return () => clearTimeout(t);
  }, [progressPct]);

  const stage = treeStageForLevel(level);
  const { treeName, blurb } = LEVEL_PATH[stage];
  const stageIdx = LEVEL_ORDER.indexOf(stage);
  const maxed = level >= MAX_LEVEL;

  return (
    <div className="border border-[#E7E5E4] rounded-[14px] p-[clamp(18px,3.6vw,26px)] mb-3.5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-[clamp(18px,4vw,32px)] items-center bg-white">
      <div className="relative bg-[#FAFAF9] border border-[#E7E5E4] rounded-xl p-4 flex justify-center">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <SpeechBubble phrases={TREE_PHRASES} />
        </div>
        <svg viewBox="0 0 220 230" className="w-[clamp(130px,20vw,170px)] h-auto" aria-hidden="true">
          <LevelCreature level={stage} costumeIds={costumeIds} />
          <g className="bob">
            <circle cx="60" cy="78" r="6" fill="#FACC15" />
          </g>
          <g className="bob2">
            <circle cx="164" cy="72" r="6" fill="#FB7185" />
          </g>
        </svg>
      </div>

      <div>
        <p className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A1A1AA] mb-1.5">
          Your tree
        </p>
        <h2 className="font-semibold text-lg tracking-[-0.01em] mb-0.5">
          {treeName}
          <span className="inline-block ml-2 text-[12.5px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-md px-2 py-px align-[2px]">
            Lv. {level}
          </span>
        </h2>
        <p className="text-[13.5px] text-[#71717A] mb-4">{blurb}</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 bg-[#E7E5E4] rounded-full overflow-hidden">
            <i
              className="not-italic block h-full bg-[#16A34A] rounded-full transition-[width] duration-1000"
              style={{ width: `${fill}%` }}
            />
          </div>
          <span className="text-[12.5px] text-[#71717A] font-medium whitespace-nowrap">
            {maxed ? "Fully grown 🎉" : `${xpInto}/${xpNeeded} XP to Lv. ${level + 1}`}
          </span>
        </div>

        <div className="flex gap-2">
          {LEVEL_ORDER.map((lv, idx) => {
            const state = idx < stageIdx ? "done" : idx === stageIdx ? "now" : "todo";
            return (
              <div
                key={lv}
                className={`flex-1 rounded-lg py-[7px] px-1 text-center text-sm border transition-all ${
                  state === "now"
                    ? "bg-[#F0FDF4] border-[#BBF7D0]"
                    : state === "done"
                    ? "bg-white border-[#E7E5E4]"
                    : "bg-white border-[#E7E5E4] grayscale opacity-45"
                }`}
              >
                <span className={state === "now" ? "inline-block bob" : undefined}>
                  {LEVEL_PATH[lv].icon}
                </span>
                <small
                  className={`block text-[10.5px] font-semibold mt-px ${
                    state === "now" ? "text-[#16A34A]" : state === "done" ? "text-[#71717A]" : "text-[#A1A1AA]"
                  }`}
                >
                  {STAGE_RANGES[idx]}
                </small>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
