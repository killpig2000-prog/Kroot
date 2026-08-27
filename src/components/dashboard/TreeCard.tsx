"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { COSTUMES, GARDEN_SLOTS, SLOT_LABELS, SceneLayer, WEARABLE_SLOTS, costumeById, skyFor } from "@/lib/costumes";
import { LEVEL_ORDER, LEVEL_PATH, SPECIES, type CefrLevel } from "@/lib/tree";
import { FULLY_GROWN_LEVEL, MAX_LEVEL, treeHeightMetres, treeStageForLevel } from "@/lib/level";
import VeteranTree, { VETERAN_MILESTONES, veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import SpeechBubble from "@/components/ui/SpeechBubble";
import LevelCreature from "@/components/dashboard/LevelCreature";
import TreeGrowthPopup from "@/components/dashboard/TreeGrowthPopup";

const TREE_PHRASES = [
  { kr: "화이팅!", en: "you got this!" },
  { kr: "오늘도 좋아요!", en: "looking good today!" },
  { kr: "물 줘서 고마워요", en: "thanks for the water" },
  { kr: "같이 자라요", en: "let's grow together" },
];

// One label per 10-level tree stage; from 50 the tree only grows taller.
const STAGE_RANGES = ["1-9", "10-19", "20-29", "30-39", "40-49", "50+"];

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
  const [equipped, setEquipped] = useState<string[]>(costumeIds);
  const [busy, setBusy] = useState(false);
  const [wardrobeOpen, setWardrobeOpen] = useState(false);

  const owned = COSTUMES.filter((c) => (ownedIds ?? []).includes(c.id));
  const slots = [...WEARABLE_SLOTS, ...GARDEN_SLOTS];

  useEffect(() => {
    if (!wardrobeOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [wardrobeOpen]);

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

  const stage = treeStageForLevel(level);
  const { treeName, blurb } = LEVEL_PATH[stage];
  const sp = SPECIES[species ?? stage];
  const stageIdx = LEVEL_ORDER.indexOf(stage);
  const maxed = level >= MAX_LEVEL;
  // Lv.50+: same card width, taller frame — the trunk keeps growing.
  const veteran = level >= FULLY_GROWN_LEVEL;
  const frameH = veteran ? veteranFrameHeight(level) : 230;
  const metres = treeHeightMetres(level);
  const nextKeepsake = VETERAN_MILESTONES.find((m) => m.level > level);
  // Garden items: a sky costume swaps the frame's gradient (and hides the
  // default sun); ground/friends ride down with the taller veteran frame.
  const sky = skyFor(equipped);
  const groundShift = frameH - 230;

  return (
    <div className={`relative border border-line p-[clamp(18px,3.6vw,26px)] mb-3.5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-[clamp(18px,4vw,32px)] ${veteran ? "items-start" : "items-center"} bg-white rotate-[-0.4deg] shadow-[0_14px_30px_-18px_rgba(60,50,30,.35)]`}>
      <TreeGrowthPopup level={level} species={species} />
      <span
        aria-hidden="true"
        className="absolute -top-2 left-9 -rotate-3 w-[56px] h-[17px] border z-10"
        style={{ background: "rgba(190,227,248,.65)", borderColor: "rgba(150,200,230,.45)" }}
      />
      {/* the tree, as a polaroid in the album */}
      <figure className="relative m-0 bg-white border border-line p-1.5 pb-6 rotate-[1.2deg] shadow-[0_10px_22px_-12px_rgba(60,50,30,.35)]">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <SpeechBubble phrases={TREE_PHRASES} />
        </div>
        <div
          className="flex justify-center px-3 pt-3"
          style={{ background: sky ?? "linear-gradient(180deg,#DFF1FF 0%,#F0FBF1 62%,#E4F3DA 100%)" }}
        >
          <svg viewBox={`0 0 220 ${frameH}`} className="w-[clamp(140px,20vw,190px)] h-auto transition-[height] duration-500" aria-hidden="true">
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
            <ellipse cx="110" cy={frameH + 4} rx="150" ry="34" fill="url(#tc-hill)" />
            <SceneLayer costumeIds={equipped} layer="behind" />
            {!sky && (
              <>
                <circle cx="182" cy="34" r="30" fill="url(#tc-sun)" />
                <circle cx="182" cy="34" r="12" fill="#FFDE7A" />
                <g fill="#FFFFFF" opacity=".85">
                  <ellipse cx="46" cy="36" rx="16" ry="6" />
                  <ellipse cx="60" cy="32" rx="11" ry="5" />
                  <ellipse cx="140" cy="60" rx="12" ry="4.6" opacity=".7" />
                </g>
              </>
            )}
            {veteran && species ? (
              <VeteranTree level={level} species={species} costumeIds={equipped} />
            ) : (
              <LevelCreature level={stage} costumeIds={equipped} species={species} />
            )}
            <SceneLayer costumeIds={equipped} layer="front" groundShift={groundShift} />
            <g className="bob">
              <circle cx="60" cy="78" r="6" fill="#FACC15" />
            </g>
            <g className="bob2">
              <circle cx="164" cy="72" r="6" fill="#FB7185" />
            </g>
          </svg>
        </div>
        <figcaption className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-bold text-[#8A8478]">
          {veteran ? `오늘의 나무 · ${metres}m 🌲` : "오늘의 나무 🌱"}
        </figcaption>
      </figure>

      <div>
        <p className="text-[11.5px] font-extrabold tracking-[.08em] uppercase text-[#B7AE9C] mb-1.5">
          Your tree · 성장 앨범
        </p>
        <h2 className="font-semibold text-lg tracking-[-0.01em] mb-0.5">
          {sp.name} <span className="text-faint font-medium">· {treeName}</span>
          <span
            className={`inline-block ml-2 text-[12.5px] font-semibold border rounded-md px-2 py-px align-[2px] ${
              veteran ? "bg-[#FFF8E6] text-[#B7791F] border-[#F3D98A]" : "bg-success-bg text-success border-success-line"
            }`}
          >
            Lv. {level}
          </span>
        </h2>
        {veteran && (
          <p className="font-semibold text-[22px] text-[#B7791F] tracking-[-0.01em] tabular-nums mb-0.5">
            {metres}
            <span className="text-[12px] text-muted font-bold ml-1">m tall</span>
          </p>
        )}
        <p className="text-[13.5px] text-muted mb-4">
          <span className="kr font-semibold">{sp.krName}</span> —{" "}
          {veteran ? "Fully grown, still climbing. Every ten levels the canopy gains a tier." : blurb}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 bg-[#EFE9DB] rounded-full overflow-hidden">
            <i
              className={`not-italic block h-full rounded-full transition-[width] duration-1000 ${veteran ? "bg-[#B7791F]" : "bg-success"}`}
              style={{ width: `${fill}%` }}
            />
          </div>
          <span className="text-[12.5px] text-muted font-medium whitespace-nowrap">
            {maxed ? "Reached the stars 🌟" : `${xpInto}/${xpNeeded} XP to Lv. ${level + 1}`}
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
                    ? "bg-success-bg border-success-line"
                    : state === "done"
                    ? "bg-white border-line"
                    : "bg-white border-line grayscale opacity-45"
                }`}
              >
                <span className={state === "now" ? "inline-block bob" : undefined}>
                  {LEVEL_PATH[lv].icon}
                </span>
                <small
                  className={`block text-[10.5px] font-semibold mt-px ${
                    state === "now" ? "text-success" : state === "done" ? "text-muted" : "text-faint"
                  }`}
                >
                  {STAGE_RANGES[idx]}
                </small>
              </div>
            );
          })}
        </div>

        {/* keepsake ladder — what the taller tree has earned, and what's next */}
        {veteran && (
          <div className="mt-4 pt-3.5 border-t border-dashed border-line">
            <p className="text-[11.5px] font-extrabold tracking-[.08em] uppercase text-[#B7AE9C] mb-2">
              Canopy keepsakes
            </p>
            <div className="flex flex-wrap gap-1.5">
              {VETERAN_MILESTONES.map((m) => {
                const on = level >= m.level;
                const next = nextKeepsake?.level === m.level;
                return (
                  <span
                    key={m.level}
                    className={`text-[12px] font-semibold rounded-full px-2.5 py-1 border ${
                      on
                        ? "bg-[#FFF8E6] border-[#F3D98A] text-[#B7791F]"
                        : next
                        ? "bg-white border-line text-muted"
                        : "bg-white border-line text-faint opacity-50"
                    }`}
                  >
                    <span className="tabular-nums">Lv.{m.level}</span> · {m.name}
                    {on && " ✓"}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* wardrobe — opens a popup so the card stays a fixed height */}
        {userId && ownedIds && (
          <div className="mt-4 pt-3.5 border-t border-dashed border-line">
            <button
              onClick={() => setWardrobeOpen(true)}
              className="w-full flex items-center justify-between gap-2 rounded-xl border border-line bg-warm px-3 py-2.5 hover:border-faint transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <b className="text-[12.5px] font-bold whitespace-nowrap">My costume</b>
                {owned.length === 0 ? (
                  <span className="text-[12px] text-muted truncate">No costumes yet</span>
                ) : (
                  <span className="flex -space-x-1.5">
                    {owned
                      .filter((c) => equipped.includes(c.id))
                      .slice(0, 4)
                      .map((c) => (
                        <span
                          key={c.id}
                          className="w-6 h-6 rounded-full bg-success-bg border border-white flex items-center justify-center text-[12px]"
                          aria-hidden="true"
                        >
                          {c.render ? (
                            <svg viewBox="-40 -30 80 60" className="w-4 h-[10px]" aria-hidden="true">
                              {c.render()}
                            </svg>
                          ) : (
                            c.icon
                          )}
                        </span>
                      ))}
                    {equipped.length === 0 && (
                      <span className="text-[12px] text-muted">nothing equipped</span>
                    )}
                  </span>
                )}
              </span>
              <span className="text-[12.5px] font-semibold text-muted whitespace-nowrap">Dress up →</span>
            </button>
          </div>
        )}
      </div>

      {userId && ownedIds && wardrobeOpen && (
        <>
          <button
            aria-label="Close"
            onClick={() => setWardrobeOpen(false)}
            className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pointer-events-none">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="My costume"
              className="pointer-events-auto w-full max-w-[420px] max-h-[85vh] flex flex-col bg-white rounded-[20px] shadow-[0_30px_70px_-20px_rgba(40,35,25,.35)]"
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="font-semibold text-[16px] tracking-[-0.01em]">My costume</h3>
                <button
                  onClick={() => setWardrobeOpen(false)}
                  aria-label="Close"
                  className="w-7 h-7 flex items-center justify-center rounded-full text-muted hover:bg-warm-2 transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="overflow-y-auto px-5 pb-5">
                {owned.length === 0 ? (
                  <p className="text-[13px] text-muted py-4">
                    No costumes yet — treat your tree at the shop.
                  </p>
                ) : (
                  slots.map((slot) => {
                    const items = owned.filter((c) => c.slot === slot);
                    if (items.length === 0) return null;
                    return (
                      <div key={slot} className="mb-4 last:mb-0">
                        <p className="text-[10.5px] font-extrabold tracking-[.07em] uppercase text-faint mb-1.5">
                          {SLOT_LABELS[slot].icon} {SLOT_LABELS[slot].en}
                        </p>
                        <div className="flex gap-2.5 overflow-x-auto -mx-1 px-1 pb-1">
                          {items.map((c) => {
                            const on = equipped.includes(c.id);
                            return (
                              <button
                                key={c.id}
                                onClick={() => toggleCostume(c.id)}
                                disabled={busy}
                                aria-pressed={on}
                                className="flex-none w-[74px] text-center disabled:opacity-60"
                              >
                                <span
                                  className={`relative w-[74px] h-14 flex items-center justify-center rounded-xl border transition-all ${
                                    on
                                      ? "bg-success-bg border-success-line shadow-[0_3px_0_var(--color-success-line)]"
                                      : "bg-warm border-line hover:border-faint"
                                  }`}
                                >
                                  {c.render ? (
                                    <svg viewBox="-40 -30 80 60" className="w-9 h-[26px]" aria-hidden="true">
                                      {c.render()}
                                    </svg>
                                  ) : (
                                    <span className="text-[22px] leading-none" aria-hidden="true">{c.icon}</span>
                                  )}
                                  {on && (
                                    <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                                  )}
                                </span>
                                <span className={`block text-[10.5px] font-semibold mt-1.5 leading-tight ${on ? "text-success-deep" : "text-muted"}`}>
                                  {c.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Link
                href="/shop"
                className="text-center text-[13px] font-semibold text-muted hover:text-charcoal transition-colors border-t border-line px-5 py-3"
              >
                Garden Shop →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
