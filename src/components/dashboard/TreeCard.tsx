"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SceneLayer, skinFor, skyFor } from "@/lib/costumes";
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

// The same dawn sky the first-open intro (SeedIntro) uses, so the seed the
// learner just woke up is standing in the same garden on the dashboard.
const SCENE_SKY = "linear-gradient(180deg,#FFF9EC 0%,#EAF4F3 40%,#BEE3F0 62%,#DFF3E4 100%)";

// The tree stands in a garden, not in a card. Three layers: the scene (sky,
// hills, the creature, a speech bubble, two pills and one XP line), then a
// slim identity row (avatar, name, grade), then the growth/keepsakes panels
// that open from that row. Everything the old card showed is still here —
// the polaroid frame, dashed border and rotated paper are what went.
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
  // Lv.50+: the trunk keeps growing, so the drawing gets taller. A skin
  // hides the tree, trunk included, so the frame stays 230 tall.
  const veteran = level >= FULLY_GROWN_LEVEL && !skinFor(equipped);
  const frameH = veteran ? veteranFrameHeight(level) : 230;
  const metres = treeHeightMetres(level);
  const nextKeepsake = VETERAN_MILESTONES.find((m) => m.level > level);
  // Garden items: a sky costume swaps the scene's gradient (and hides the
  // default clouds); ground/friends ride down with the taller veteran frame.
  const sky = skyFor(equipped);
  const groundShift = frameH - 230;
  // The creature's drawn width; its height follows the frame. The scene is
  // at least tall enough for the tallest veteran plus the XP line under it.
  const treeWidth = "clamp(170px, 44vw, 230px)";
  const treeHeightMax = Math.round((230 * frameH) / 220);
  const sceneMin = Math.max(320, treeHeightMax + 96);

  const treeImage = (
    <svg
      viewBox={`0 0 220 ${frameH}`}
      className="block h-auto transition-[height] duration-500"
      style={{ width: treeWidth }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tc-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CDE8C2" />
          <stop offset="100%" stopColor="#BBDCAE" />
        </linearGradient>
      </defs>
      {/* a soft mound under the soil so costume ground items still sit on grass */}
      <ellipse cx="110" cy={frameH + 4} rx="150" ry="34" fill="url(#tc-hill)" />
      <SceneLayer costumeIds={equipped} layer="behind" />
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
  );

  return (
    <section className="relative mb-3.5">
      <TreeGrowthPopup level={level} species={species} />

      {/* ── the garden ─────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-[18px] border border-line"
        style={{ background: sky ?? SCENE_SKY, minHeight: `${sceneMin}px` }}
      >
        <svg
          className="absolute left-[-4%] right-[-4%] bottom-0 w-[108%] h-[44%]"
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 110 C140 60 260 90 400 96 C540 102 660 50 800 92 L800 200 L0 200Z" fill="#CFE9D6" />
          <path d="M0 150 C160 120 300 140 440 132 C600 122 700 140 800 128 L800 200 L0 200Z" fill="#B9DDC3" />
          <path d="M0 176 C200 160 400 172 800 164 L800 200 L0 200Z" fill="#DFF3E4" />
        </svg>
        {!sky && (
          <svg className="absolute top-[14%] left-0 w-full h-[18%]" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
            <g fill="#FFFFFF" opacity=".8">
              <ellipse cx="62" cy="30" rx="26" ry="9" />
              <ellipse cx="84" cy="24" rx="17" ry="7" />
              <ellipse cx="318" cy="38" rx="22" ry="7.5" opacity=".7" />
            </g>
          </svg>
        )}

        {/* level + stage, streak + coins — two pills, nothing else up top */}
        <span
          className={`absolute top-3 left-3 z-[4] inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-extrabold backdrop-blur-[6px] ${
            veteran ? "border-amber-line text-[#B7791F]" : "border-success-line text-success-deep"
          }`}
          style={{ background: "rgba(255,253,246,.8)" }}
        >
          {t("levelBadge", { level })}
          <span className="font-bold text-charcoal tabular-nums">
            · {veteran ? `${metres} ${t("metresTall")}` : LEVEL_PATH[stage].treeName}
          </span>
        </span>
        <span
          className="absolute top-3 right-3 z-[4] inline-flex items-center gap-1.5 rounded-full border border-success-line px-2.5 py-1 text-[12px] font-extrabold text-success-deep backdrop-blur-[6px]"
          style={{ background: "rgba(255,253,246,.8)" }}
        >
          {/* phones get the numbers only — the full "15 day streak · 550 coins"
              ran into the level pill at 360–390px */}
          <span className="sm:hidden tabular-nums" aria-label={`${ti("streak", { n: streakDays })} · ${ti("coins", { n: coins })}`}>
            🔥 {streakDays} <span className="text-faint">·</span> 🪙 {coins}
          </span>
          <span className="hidden sm:inline">
            {ti("streak", { n: streakDays })} <span className="text-faint">·</span> {ti("coins", { n: coins })}
          </span>
        </span>

        {/* the creature — centred on phones, left of centre once the scene is wide */}
        <div className="absolute bottom-[58px] left-1/2 sm:left-[36%] -translate-x-1/2 z-[3]">
          {linkToShop ? (
            <Link href="/shop" aria-label={t("openShop")} className="block transition-transform hover:-translate-y-0.5">
              {treeImage}
            </Link>
          ) : (
            treeImage
          )}
        </div>

        {/* what the tree says: above it on phones, beside it on wide screens */}
        <div className="absolute z-[4] left-1/2 -translate-x-1/2 top-[15%] sm:left-[58%] sm:translate-x-0 sm:top-[30%]">
          <SpeechBubble phrases={phrases} />
        </div>

        {/* one XP line on the grass */}
        <div className="absolute left-4 right-4 bottom-3 z-[4]">
          <div className="flex items-center justify-between text-[11.5px] font-extrabold text-success-deep">
            <span>
              {sp.name} <span className="kr font-semibold text-muted">{sp.krName}</span>
            </span>
            <span className="tabular-nums">{maxed ? t("maxed") : t("xpToNext", { into: xpInto, needed: xpNeeded, next: level + 1 })}</span>
          </div>
          <div className="mt-1 h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(255,253,246,.7)" }}>
            <i
              className={`not-italic block h-full rounded-full transition-[width] duration-1000 ${veteran ? "bg-[#B7791F]" : "bg-success"}`}
              style={{ width: `${fill}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── who this garden belongs to ─────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3 px-1">
        <AvatarUploader userId={userId} avatarUrl={avatarUrl} />
        <h2 className="font-semibold text-lg tracking-[-0.01em] flex items-center gap-2 min-w-0 flex-1 basis-[160px]">
          <NameEditor userId={userId} name={displayName} />
          {species && (
            <span className="flex-none text-[11.5px] font-extrabold tracking-[.03em] text-success bg-success-bg border border-success-line rounded-md px-1.5 py-px">
              {species}
            </span>
          )}
        </h2>
        {/* growth stages + veteran keepsakes fold behind small toggles */}
        <div className="flex gap-1.5 flex-none">
          <button
            type="button"
            aria-expanded={openTab === "growth"}
            onClick={() => setOpenTab(openTab === "growth" ? null : "growth")}
            className={`text-[12px] font-semibold rounded-full px-2.5 py-1 border transition-colors ${
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
              className={`text-[12px] font-semibold rounded-full px-2.5 py-1 border transition-colors ${
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
                <span className={state === "now" ? "inline-block bob" : undefined}>{LEVEL_PATH[lv].icon}</span>
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
    </section>
  );
}
