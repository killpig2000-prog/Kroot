"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SceneLayer, skyFor } from "@/lib/costumes";
import { LEVEL_ORDER, LEVEL_PATH, SPECIES, type CefrLevel } from "@/lib/tree";
import { FULLY_GROWN_LEVEL, MAX_LEVEL, treeHeightMetres, treeStageForLevel } from "@/lib/level";
import VeteranTree, { VETERAN_MILESTONES, veteranFrameHeight } from "@/components/dashboard/VeteranTree";
import SpeechBubble from "@/components/ui/SpeechBubble";
import LevelCreature from "@/components/dashboard/LevelCreature";
import TreeGrowthPopup from "@/components/dashboard/TreeGrowthPopup";
import AvatarUploader from "@/components/profile/AvatarUploader";
import NameEditor from "@/components/profile/NameEditor";

// Korean stays as-is everywhere; only the gloss follows the UI language.
const TREE_PHRASES = [
  { kr: "화이팅!", key: "fighting" },
  { kr: "오늘도 좋아요!", key: "goodToday" },
  { kr: "물 줘서 고마워요", key: "thanksWater" },
  { kr: "같이 자라요", key: "growTogether" },
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
  displayName,
  avatarUrl,
  coins,
  streakDays,
  linkToShop = false,
}: {
  level: number;
  progressPct: number;
  xpInto: number;
  xpNeeded: number;
  costumeIds?: string[];
  /** CEFR grade — decides the tree species; promotion transforms the garden. */
  species?: CefrLevel;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  coins: number;
  streakDays: number;
  streakFreezes: number;
  /** Dashboard only: tapping the tree image opens the shop/wardrobe. */
  linkToShop?: boolean;
}) {
  const t = useTranslations("dashboard.tree");
  // Identity chips reuse the /profile strings — the card absorbed that page's
  // identity header (2026-09-01), so the copy moved with it.
  const ti = useTranslations("profile.identity");
  const [fill, setFill] = useState(0);
  const [openTab, setOpenTab] = useState<"growth" | "keepsakes" | null>(null);
  const equipped = costumeIds;
  const phrases = TREE_PHRASES.map((p) => ({ kr: p.kr, en: t(`phrases.${p.key}`) }));

  useEffect(() => {
    const timer = setTimeout(() => setFill(progressPct), 200);
    return () => clearTimeout(timer);
  }, [progressPct]);

  const stage = treeStageForLevel(level);
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
    <div className={`relative border border-line p-[clamp(18px,3.6vw,26px)] mb-3.5 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-[clamp(18px,4vw,32px)] ${veteran ? "items-start" : "items-center"} bg-cream rotate-[-0.4deg] shadow-[0_14px_30px_-18px_rgba(60,50,30,.35)]`}>
      <TreeGrowthPopup level={level} species={species} />
      <span
        aria-hidden="true"
        className="absolute -top-2 left-9 -rotate-3 w-[56px] h-[17px] border z-10"
        style={{ background: "rgba(190,227,248,.65)", borderColor: "rgba(150,200,230,.45)" }}
      />
      {/* the tree, as a polaroid in the album */}
      <figure className="relative m-0 bg-cream border border-line p-1.5 pb-1.5 rotate-[1.2deg] shadow-[0_10px_22px_-12px_rgba(60,50,30,.35)]">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <SpeechBubble phrases={phrases} />
        </div>
        {(() => {
          const treeImage = (
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
          );
          return linkToShop ? (
            <Link href="/shop" aria-label={t("openShop")} className="block transition-transform hover:-translate-y-0.5">
              {treeImage}
            </Link>
          ) : (
            treeImage
          );
        })()}
        {/* species lives on the polaroid, not in the identity block */}
        <figcaption className="text-center text-[11.5px] font-bold text-muted pt-1.5">
          {sp.name} <span className="kr font-semibold text-faint ml-1">{sp.krName}</span>
        </figcaption>
      </figure>

      <div>
        {/* streak / coins — top-right on wide cards, a leading row when the
            card stacks on mobile (absolute children leave the grid) */}
        <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-0 sm:absolute sm:top-3 sm:right-3.5 sm:justify-end sm:z-10">
          <span className="text-[12px] font-semibold text-success bg-success-bg border border-success-line rounded-full px-2.5 py-0.5">
            {ti("streak", { n: streakDays })}
          </span>
          <span className="text-[12px] font-semibold text-muted bg-warm border border-line rounded-full px-2.5 py-0.5">
            {ti("coins", { n: coins })}
          </span>
        </div>

        <div className="flex items-center gap-3 mb-1">
          <AvatarUploader userId={userId} avatarUrl={avatarUrl} />
          <h2 className="font-semibold text-lg tracking-[-0.01em] flex items-center gap-2 min-w-0">
            <NameEditor userId={userId} name={displayName} />
            {species && (
              <span className="flex-none text-[11.5px] font-extrabold tracking-[.03em] text-success bg-success-bg border border-success-line rounded-md px-1.5 py-px">
                {species}
              </span>
            )}
          </h2>
        </div>
        {veteran && (
          <p className="font-semibold text-[22px] text-[#B7791F] tracking-[-0.01em] tabular-nums mb-0.5">
            {metres}
            <span className="text-[12px] text-muted font-bold ml-1">{t("metresTall")}</span>
          </p>
        )}

        <div className="flex items-center gap-3 mb-3.5 mt-2.5">
          <span
            className={`flex-none text-[12.5px] font-semibold border rounded-md px-2 py-px ${
              veteran ? "bg-[var(--tint-amber)] text-[#B7791F] border-amber-line" : "bg-success-bg text-success border-success-line"
            }`}
          >
            {t("levelBadge", { level })}
          </span>
          <div className="flex-1 h-1.5 bg-warm-3 rounded-full overflow-hidden">
            <i
              className={`not-italic block h-full rounded-full transition-[width] duration-1000 ${veteran ? "bg-[#B7791F]" : "bg-success"}`}
              style={{ width: `${fill}%` }}
            />
          </div>
          <span className="text-[12.5px] text-muted font-medium whitespace-nowrap">
            {maxed ? t("maxed") : t("xpToNext", { into: xpInto, needed: xpNeeded, next: level + 1 })}
          </span>
        </div>

        {/* growth stages + veteran keepsakes fold behind tabs — the strip ate
            most of the card's height while answering an occasional question */}
        <div className="flex gap-2 border-t border-dashed border-line pt-3">
          <button
            type="button"
            aria-expanded={openTab === "growth"}
            onClick={() => setOpenTab(openTab === "growth" ? null : "growth")}
            className={`text-[12.5px] font-semibold rounded-full px-3 py-1 border transition-colors ${
              openTab === "growth"
                ? "bg-success-bg border-success-line text-success"
                : "bg-warm border-line text-muted hover:text-success hover:border-success-line"
            }`}
          >
            🌱 {t("growthTab")}{" "}
            <span className={`inline-block text-[10px] transition-transform ${openTab === "growth" ? "rotate-180" : ""}`}>▾</span>
          </button>
          {veteran && (
            <button
              type="button"
              aria-expanded={openTab === "keepsakes"}
              onClick={() => setOpenTab(openTab === "keepsakes" ? null : "keepsakes")}
              className={`text-[12.5px] font-semibold rounded-full px-3 py-1 border transition-colors ${
                openTab === "keepsakes"
                  ? "bg-[var(--tint-amber)] border-amber-line text-[#B7791F]"
                  : "bg-warm border-line text-muted hover:text-[#B7791F] hover:border-amber-line"
              }`}
            >
              🏅 {t("keepsakesTab")}{" "}
              <span className={`inline-block text-[10px] transition-transform ${openTab === "keepsakes" ? "rotate-180" : ""}`}>▾</span>
            </button>
          )}
        </div>

        {openTab === "growth" && (
          <div className="flex gap-2 mt-3">
            {LEVEL_ORDER.map((lv, idx) => {
              const state = idx < stageIdx ? "done" : idx === stageIdx ? "now" : "todo";
              return (
                <div
                  key={lv}
                  className={`flex-1 rounded-lg py-[7px] px-1 text-center text-sm border transition-all ${
                    state === "now"
                      ? "bg-success-bg border-success-line"
                      : state === "done"
                      ? "bg-cream border-line"
                      : "bg-cream border-line grayscale opacity-45"
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
        )}

        {openTab === "keepsakes" && veteran && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {VETERAN_MILESTONES.map((m) => {
              const on = level >= m.level;
              const next = nextKeepsake?.level === m.level;
              return (
                <span
                  key={m.level}
                  className={`text-[12px] font-semibold rounded-full px-2.5 py-1 border ${
                    on
                      ? "bg-[var(--tint-amber)] border-amber-line text-[#B7791F]"
                      : next
                      ? "bg-cream border-line text-muted"
                      : "bg-cream border-line text-faint opacity-50"
                  }`}
                >
                  <span className="tabular-nums">Lv.{m.level}</span> · {t(`keepsakes.${m.level}`)}
                  {on && " ✓"}
                </span>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
