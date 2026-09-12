"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import GardenStage, { AuraLayer, SkyLayer, gardenFrame } from "@/components/dashboard/GardenStage";
import WateringCan from "@/components/dashboard/WateringCan";
import type { CefrLevel } from "@/lib/tree";
import { ART_STAGE_STARTS, LOOK_KEYS, evolutionProgress } from "@/lib/level";
import { LOOK_SRC } from "@/components/dashboard/LevelCreature";
import GardenScene from "@/components/ui/GardenScene";
import SpeechBubble from "@/components/ui/SpeechBubble";
import Glyph from "@/components/dashboard/Glyph";
import TreeGrowthPopup from "@/components/dashboard/TreeGrowthPopup";
import { GREETING_KR, TREE_PHRASES, greetingKey, lowerGloss } from "@/lib/tree-phrases";
import AvatarUploader from "@/components/profile/AvatarUploader";
import NameEditor from "@/components/profile/NameEditor";

// The tree greets you by your local clock — the page used to do this in an
// <h1> above the garden while the tree said something else underneath, two
// speakers for one moment. Korean stays Korean in every UI language; the
// gloss comes from the same ui.* strings the old heading used.
const emptySubscribe = () => () => {};
// How long the greeting stays before the tree moves on to its usual lines.
const GREETING_HOLD_MS = 5000;

// The tree stands in a garden, not in a card. Three layers: the scene (sky,
// hills, the creature, a speech bubble, two pills and one XP line), then a
// slim identity row (avatar, name, grade), then the growth/keepsakes panels
// that open from that row. Everything the old card showed is still here —
// the polaroid frame, dashed border and rotated paper are what went. On
// phones the scene runs edge to edge under the header (the sky is the
// page's top, not a picture in it); from md up it is a card in the column.
export default function TreeCard({
  level,
  xp,
  costumeIds = [],
  species,
  userId,
  displayName,
  avatarUrl,
  coins,
  streakDays,
  linkToShop = false,
  onTreeTap,
  review,
  showOwner = true,
}: {
  level: number;
  /** Total XP — the XP line counts down to the tree's next look. */
  xp: number;
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
  /** My room: tapping the tree opens it big, with its growth rings. */
  onTreeTap?: () => void;
  /** Today's review, for the watering can on the grass; no can when absent. */
  review?: { due: number; cap: number; doneToday: boolean };
  /** My room hides the avatar/name row — the status bar already shows who you are. */
  showOwner?: boolean;
}) {
  const t = useTranslations("dashboard.tree");
  // Identity chips reuse the /profile strings — the card absorbed that page's
  // identity header (2026-09-01), so the copy moved with it.
  const ti = useTranslations("profile.identity");
  const tu = useTranslations("ui");
  // The XP line counts down to the next look (2026-09-12, user call).
  const evo = evolutionProgress(xp);
  const [fill, setFill] = useState(0);
  const [openTab, setOpenTab] = useState<"growth" | null>(null);
  // the watering can's pour: the tree sways and thanks you, as for a done quest
  const [watering, setWatering] = useState(false);
  const equipped = costumeIds;
  // The server can't know the visitor's clock: it renders "어서 오세요" and
  // the local-time greeting swaps in right after hydration (same trick the
  // old Greeting heading used; a useState initializer would be discarded).
  const hour = useSyncExternalStore(emptySubscribe, () => new Date().getHours(), () => -1);
  const gk = greetingKey(hour);
  const gloss = tu(gk);
  const phrases = [
    {
      kr: `${GREETING_KR[gk]}, ${displayName}!`,
      en: lowerGloss(gloss),
    },
    ...TREE_PHRASES.map((p) => ({ kr: p.kr, en: t(`phrases.${p.key}`) })),
  ];

  useEffect(() => {
    const timer = setTimeout(() => setFill(evo.pct), 200);
    return () => clearTimeout(timer);
  }, [evo.pct]);

  // The frame's shape (sky costume) comes from the shared stage so the pills
  // and the scene agree with the drawing.
  const { frameH, sky } = gardenFrame(level, equipped);
  // The creature's drawn width; its height follows the frame. The scene is
  // at least tall enough for the tallest veteran plus the XP line under it.
  // 2026-09-11 (user: "나무크기가 좀 작은거 같아"): the old clamp(170px, 44vw,
  // 230px) never actually reached its own max within the phone range — at
  // 430px (AGENTS.md's largest phone reference width) 44vw is only 189px,
  // so the tree sat well under "max" everywhere from 360 to 430. Re-picked
  // the vw factor so 430px hits the max exactly, and raised both ends.
  const treeWidth = "clamp(218px, 60.5vw, 260px)";
  const treeHeightMax = Math.round((260 * frameH) / 220);
  // Tall enough for the pill row, the bubble over the crown, the tree and
  // the XP line: 320px on a phone, taller once the tree reaches 230px wide.
  const sceneMin = `max(320px, calc(${treeWidth} * ${(frameH / 220).toFixed(3)} + 150px), ${Math.max(320, treeHeightMax + 96)}px)`;

  const treeImage = (
    <div className={watering ? "cheer" : undefined}>
      <GardenStage level={level} species={species} costumeIds={equipped} width={treeWidth} />
    </div>
  );

  return (
    <section className="relative mb-3.5">
      <TreeGrowthPopup level={level} species={species} />

      {/* ── the garden ─────────────────────────────────────────────── */}
      {/* Phones: full-bleed — the negative margins undo <main>'s horizontal
          padding and its 26px top padding exactly, so the sky meets the
          header line and both screen edges; only the bottom corners round.
          md+: the same scene as a bordered card inside the column. */}
      <GardenScene
        clouds={!sky}
        className="-mx-[clamp(18px,3vw,36px)] -mt-[24px] rounded-b-[22px] border-b border-line md:mx-0 md:mt-0 md:rounded-[20px] md:border"
        style={{ minHeight: sceneMin, ...(sky ? { background: sky } : {}) }}
      >

        {/* level + stage, streak + coins — two pills, nothing else up top */}
        <span
          className="absolute top-3 left-3 z-[4] inline-flex items-center gap-1.5 rounded-full border border-success-line px-2.5 py-1 text-[12.5px] font-extrabold text-success-deep backdrop-blur-[6px]"
          style={{ background: "rgba(255,253,246,.8)" }}
        >
          {t("levelBadge", { level })}
          <span className="font-bold text-charcoal">· {t(`looks.${LOOK_KEYS[evo.look]}`)}</span>
        </span>
        <span
          className="absolute top-3 right-3 z-[4] inline-flex items-center gap-1.5 rounded-full border border-success-line px-2.5 py-1 text-[12.5px] font-extrabold text-success-deep backdrop-blur-[6px]"
          style={{ background: "rgba(255,253,246,.8)" }}
        >
          {/* phones: coins only — the header already shows the streak
              two rows up, and the pair ran into the level pill at 360px */}
          <span className="sm:hidden inline-flex items-center gap-[3px] tabular-nums" aria-label={ti("coins", { n: coins })}>
            <Glyph name="coin" className="w-[13px] h-[13px]" /> {coins}
          </span>
          <span className="hidden sm:inline">
            {ti("streak", { n: streakDays })} <span className="text-faint">·</span> {ti("coins", { n: coins })}
          </span>
        </span>

        {/* a sky costume's moon, stars, snow or rain, over the whole garden */}
        <SkyLayer costumeIds={equipped} />
        {/* an aura's rainbow, aurora or glow, over the whole garden */}
        <AuraLayer costumeIds={equipped} />

        {/* the creature — centred at every width (2026-09-10), the bubble over it */}
        <div className="absolute bottom-[56px] left-1/2 -translate-x-1/2 z-[3]">
          {onTreeTap ? (
            <button type="button" onClick={onTreeTap} aria-label={t("openPeek")} className="block cursor-zoom-in transition-transform hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99]">
              {treeImage}
            </button>
          ) : linkToShop ? (
            <Link href="/shop" aria-label={t("openShop")} className="block transition-transform hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99]">
              {treeImage}
            </Link>
          ) : (
            treeImage
          )}
        </div>

        {/* what the tree says — the greeting first, then its usual lines;
            always over the tree */}
        <div className="absolute z-[4] w-max left-1/2 -translate-x-1/2 top-[44px]">
          {/* while it's being watered the tree says thanks first, as the
              Garden card does; keyed so the line restarts from the top */}
          <SpeechBubble
            key={watering ? "thanks" : "calm"}
            phrases={watering ? [...phrases.filter((p) => p.kr === "물 줘서 고마워요"), ...phrases.filter((p) => p.kr !== "물 줘서 고마워요")] : phrases}
            firstHoldMs={watering ? 4200 : GREETING_HOLD_MS}
            wrap
          />
        </div>

        {/* review: the watering can on the grass, bottom-right — a direct
            child of the scene so it can find the tree it waters */}
        {review && (
          <WateringCan
            due={review.due}
            cap={review.cap}
            doneToday={review.doneToday}
            onPour={() => setWatering(true)}
            className="absolute right-[clamp(18px,6vw,34px)] bottom-[48px]"
            style={{ width: "clamp(66px, 18vw, 84px)" }}
          />
        )}

        {/* one XP line on the grass */}
        <div className="absolute left-4 right-4 bottom-3 z-[4]">
          {/* the species name left the garden (2026-09-10, user call) */}
          <div className="flex items-center justify-end text-[11px] font-extrabold text-success-deep">
            <span className="tabular-nums">
              {evo.nextLook === null
                ? t("maxed")
                : t("xpToEvolve", { xp: evo.xpLeft, name: t(`looks.${LOOK_KEYS[evo.nextLook]}`) })}
            </span>
          </div>
          <div className="mt-1 h-[7px] rounded-full overflow-hidden" style={{ background: "rgba(255,253,246,.7)" }}>
            <i
              className="not-italic block h-full rounded-full transition-[width] duration-1000 bg-success"
              style={{ width: `${fill}%` }}
            />
          </div>
        </div>
      </GardenScene>

      {/* ── who this garden belongs to ─────────────────────────────── */}
      {/* one slim line: the phone dashboard fits one screen, so this row
          carries the name and the two toggles and nothing taller */}
      {showOwner && (
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2.5 px-1">
        <AvatarUploader userId={userId} avatarUrl={avatarUrl} />
        <h2 className="font-semibold text-[15px] tracking-[-0.01em] flex items-center gap-2 min-w-0 flex-1 basis-[140px]">
          <NameEditor userId={userId} name={displayName} />
          {species && (
            <span className="flex-none text-[11px] font-extrabold tracking-[.03em] text-success bg-success-bg border border-success-line rounded-md px-1.5 py-px">
              {species}
            </span>
          )}
        </h2>
        {/* growth stages + veteran keepsakes fold behind small toggles */}
        <div className="flex gap-1.5 flex-none">
          <button
            type="button"
            aria-expanded={openTab === "growth"}
            aria-label={t("growthTab")}
            onClick={() => setOpenTab(openTab === "growth" ? null : "growth")}
            className={`text-[12.5px] font-semibold rounded-full px-2.5 py-1 border transition-colors ${
              openTab === "growth"
                ? "bg-success-bg border-success-line text-success"
                : "bg-warm border-line text-muted hover:text-success hover:border-success-line"
            }`}
          >
            {/* phones show the icon only so the name row stays one line */}
            <Glyph name="sprout" className="w-[13px] h-[13px] -mt-[1px]" />{" "}
            <span className="hidden sm:inline">{t("growthTab")}</span>{" "}
            <span className={`inline-block text-[11px] transition-transform ${openTab === "growth" ? "rotate-180" : ""}`}>▾</span>
          </button>
        </div>
      </div>
      )}

      {/* the oak's seven looks, each with the level it arrives at; the ones
          still to come are silhouettes */}
      {openTab === "growth" && (
        <div className="grid grid-cols-7 gap-1.5 mt-3">
          {LOOK_KEYS.map((key, idx) => {
            const state = idx < evo.look ? "done" : idx === evo.look ? "now" : "todo";
            return (
              <div
                key={key}
                title={t(`looks.${key}`)}
                className={`rounded-lg pt-[6px] pb-[5px] px-0.5 text-center border ${
                  state === "now" ? "bg-success-bg border-success-line" : "bg-cream border-line"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LOOK_SRC[idx]}
                  alt={t(`looks.${key}`)}
                  className={`mx-auto h-[30px] w-auto max-w-full object-contain ${state === "todo" ? "brightness-0 opacity-15" : ""} ${state === "now" ? "bob" : ""}`}
                />
                <small
                  className={`block text-[11px] font-semibold mt-[3px] tabular-nums ${
                    state === "now" ? "text-success" : state === "done" ? "text-muted" : "text-faint"
                  }`}
                >
                  Lv.{ART_STAGE_STARTS[idx]}
                </small>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
