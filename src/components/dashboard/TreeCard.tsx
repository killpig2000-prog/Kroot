"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COSTUMES, costumeById } from "@/lib/costumes";
import { LEVEL_ORDER, LEVEL_PATH, SPECIES, type CefrLevel } from "@/lib/tree";
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
  species,
  userId,
  ownedIds,
}: {
  level: number;
  progressPct: number;
  xpInto: number;
  xpNeeded: number;
  costumeIds?: string[];
  /** CEFR grade — decides the tree species; promotion transforms the garden. */
  species?: CefrLevel;
  /** With ownedIds, the card grows a wardrobe strip: tap a chip to dress the tree in place. */
  userId?: string;
  ownedIds?: string[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [fill, setFill] = useState(0);
  const [evolved, setEvolved] = useState(false);
  const [equipped, setEquipped] = useState<string[]>(costumeIds);
  const [busy, setBusy] = useState(false);

  const owned = COSTUMES.filter((c) => (ownedIds ?? []).includes(c.id));

  async function toggleCostume(costumeId: string) {
    if (busy || !userId) return;
    const costume = costumeById(costumeId);
    if (!costume) return;
    setBusy(true);

    const isOn = equipped.includes(costumeId);
    if (isOn) {
      await supabase
        .from("user_costumes")
        .update({ equipped: false })
        .eq("user_id", userId)
        .eq("costume_id", costumeId);
      setEquipped((prev) => prev.filter((id) => id !== costumeId));
    } else {
      // One item per slot: unequip anything else occupying it first.
      await supabase
        .from("user_costumes")
        .update({ equipped: false })
        .eq("user_id", userId)
        .eq("slot", costume.slot);
      await supabase
        .from("user_costumes")
        .update({ equipped: true })
        .eq("user_id", userId)
        .eq("costume_id", costumeId);
      setEquipped((prev) => [
        ...prev.filter((id) => costumeById(id)?.slot !== costume.slot),
        costumeId,
      ]);
    }

    setBusy(false);
  }

  useEffect(() => {
    const t = setTimeout(() => setFill(progressPct), 200);
    return () => clearTimeout(t);
  }, [progressPct]);

  // Celebrate the species transformation once after a promotion.
  useEffect(() => {
    if (!species) return;
    const prev = localStorage.getItem("kroot-tree-species");
    localStorage.setItem("kroot-tree-species", species);
    if (!prev || prev === species || LEVEL_ORDER.indexOf(species) <= LEVEL_ORDER.indexOf(prev as CefrLevel)) return;
    const t = setTimeout(() => setEvolved(true), 400);
    return () => clearTimeout(t);
  }, [species]);

  const stage = treeStageForLevel(level);
  const { treeName, blurb } = LEVEL_PATH[stage];
  const sp = SPECIES[species ?? stage];
  const stageIdx = LEVEL_ORDER.indexOf(stage);
  const maxed = level >= MAX_LEVEL;

  return (
    <div className="relative border border-[#E3DDD0] p-[clamp(18px,3.6vw,26px)] mb-3.5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-[clamp(18px,4vw,32px)] items-center bg-white rotate-[-0.4deg] shadow-[0_14px_30px_-18px_rgba(60,50,30,.35)]">
      <span
        aria-hidden="true"
        className="absolute -top-2 left-9 -rotate-3 w-[56px] h-[17px] border z-10"
        style={{ background: "rgba(190,227,248,.65)", borderColor: "rgba(150,200,230,.45)" }}
      />
      {/* the tree, as a polaroid in the album */}
      <figure className="relative m-0 bg-white border border-[#E3DDD0] p-1.5 pb-6 rotate-[1.2deg] shadow-[0_10px_22px_-12px_rgba(60,50,30,.35)]">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <SpeechBubble phrases={TREE_PHRASES} />
        </div>
        <div
          className="flex justify-center px-3 pt-3"
          style={{ background: "linear-gradient(180deg,#DFF1FF 0%,#F0FBF1 62%,#E4F3DA 100%)" }}
        >
          <svg viewBox="0 0 220 230" className="w-[clamp(140px,20vw,190px)] h-auto" aria-hidden="true">
            {/* garden backdrop: sun, clouds, and a grass hill under the soil */}
            <defs>
              <radialGradient id="tc-sun" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFE9A8" />
                <stop offset="55%" stopColor="#FFE9A8" stopOpacity=".55" />
                <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="tc-hill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CDE8C2" />
                <stop offset="100%" stopColor="#BBDCAE" />
              </linearGradient>
            </defs>
            <circle cx="182" cy="34" r="30" fill="url(#tc-sun)" />
            <circle cx="182" cy="34" r="12" fill="#FFDE7A" />
            <g fill="#FFFFFF" opacity=".85">
              <ellipse cx="46" cy="36" rx="16" ry="6" />
              <ellipse cx="60" cy="32" rx="11" ry="5" />
              <ellipse cx="140" cy="60" rx="12" ry="4.6" opacity=".7" />
            </g>
            <ellipse cx="110" cy="234" rx="150" ry="34" fill="url(#tc-hill)" />
            <LevelCreature level={stage} costumeIds={equipped} species={species} />
            <g className="bob">
              <circle cx="60" cy="78" r="6" fill="#FACC15" />
            </g>
            <g className="bob2">
              <circle cx="164" cy="72" r="6" fill="#FB7185" />
            </g>
          </svg>
        </div>
        <figcaption className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold text-[#8A8478]">
          오늘의 나무 🌱
        </figcaption>
      </figure>

      <div>
        <p className="text-[11.5px] font-extrabold tracking-[.08em] uppercase text-[#B7AE9C] mb-1.5">
          Your tree · 성장 앨범
        </p>
        <h2 className="font-semibold text-lg tracking-[-0.01em] mb-0.5">
          {sp.name} <span className="text-[#A19A8C] font-medium">· {treeName}</span>
          <span className="inline-block ml-2 text-[12.5px] font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] rounded-md px-2 py-px align-[2px]">
            Lv. {level}
          </span>
        </h2>
        <p className="text-[13.5px] text-[#6B6560] mb-4">
          <span className="kr font-semibold">{sp.krName}</span> — {blurb}
        </p>

        {evolved && (
          <div
            className="flex items-center gap-2.5 border border-[#FDE68A] bg-[#FFFBEB] rounded-[10px] px-3.5 py-2.5 mb-4"
            style={{ animation: "fadeUp .35s ease" }}
          >
            <span className="text-[18px]" aria-hidden="true">{sp.emoji}</span>
            <span className="flex-1 text-[13px] text-[#92400E]">
              <b>Promotion!</b> Your tree transformed into a {sp.name}{" "}
              <span className="kr">({sp.krName})</span>.
            </span>
            <button
              type="button"
              onClick={() => setEvolved(false)}
              className="text-[12px] font-bold text-[#92400E] hover:underline"
            >
              Nice!
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 bg-[#EFE9DB] rounded-full overflow-hidden">
            <i
              className="not-italic block h-full bg-[#16A34A] rounded-full transition-[width] duration-1000"
              style={{ width: `${fill}%` }}
            />
          </div>
          <span className="text-[12.5px] text-[#6B6560] font-medium whitespace-nowrap">
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
                    ? "bg-white border-[#E3DDD0]"
                    : "bg-white border-[#E3DDD0] grayscale opacity-45"
                }`}
              >
                <span className={state === "now" ? "inline-block bob" : undefined}>
                  {LEVEL_PATH[lv].icon}
                </span>
                <small
                  className={`block text-[10.5px] font-semibold mt-px ${
                    state === "now" ? "text-[#16A34A]" : state === "done" ? "text-[#6B6560]" : "text-[#A19A8C]"
                  }`}
                >
                  {STAGE_RANGES[idx]}
                </small>
              </div>
            );
          })}
        </div>

        {/* wardrobe strip — dress the tree without leaving the garden */}
        {userId && ownedIds && (
          <div className="mt-4 pt-3.5 border-t border-dashed border-[#E3DDD0] flex items-center gap-2 flex-wrap">
            <b className="text-[12.5px] font-bold mr-0.5">My costume</b>
            {owned.length === 0 ? (
              <span className="text-[12.5px] text-[#6B6560]">
                No costumes yet — treat your tree at the shop.
              </span>
            ) : (
              owned.map((c) => {
                const on = equipped.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleCostume(c.id)}
                    disabled={busy}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold border transition-all disabled:opacity-60 ${
                      on
                        ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
                        : "bg-[#FAF7EF] border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
                    }`}
                  >
                    <svg viewBox="-40 -30 80 60" className="w-[26px] h-[19px]" aria-hidden="true">
                      {c.render()}
                    </svg>
                    {c.name}
                    {on && " ✓"}
                  </button>
                );
              })
            )}
            <Link
              href="/shop"
              className="ml-auto text-[12.5px] font-semibold text-[#6B6560] hover:text-[#18181B] transition-colors whitespace-nowrap"
            >
              Shop for more →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
