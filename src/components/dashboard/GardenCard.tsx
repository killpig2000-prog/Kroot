"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import GardenScene from "@/components/ui/GardenScene";
import SpeechBubble from "@/components/ui/SpeechBubble";
import GardenStage, { gardenFrame } from "@/components/dashboard/GardenStage";
import WateringCan from "@/components/dashboard/WateringCan";
import { TREE_PHRASES } from "@/lib/tree-phrases";
import { playWater } from "@/lib/sfx";
import { MAX_LEVEL, treeHeightMetres, treeStageForLevel } from "@/lib/level";
import { LEVEL_PATH, type CefrLevel } from "@/lib/tree";

// The phone Garden's tree, option 2a (2026-09-09): an inset garden card
// where TreeBand's one line used to be. The band gave the tree a 48px
// thumbnail on a cream strip and put the streak and coins beside it; here
// the tree stands in the same GardenScene the desktop hero and every
// "moment" screen use — a real sky, hills and horizon — but bordered, with
// the page's margins on both sides rather than full-bleed, so the phone
// home still reads as a column of cards. Streak and coins moved up to the
// header row next to the greeting.
//
// Still one tap to My room, and still the tour's "tree" target.
export default function GardenCard({
  level,
  progressPct,
  xpInto,
  xpNeeded,
  costumeIds = [],
  species,
  celebrateKey = null,
  review,
}: {
  level: number;
  progressPct: number;
  xpInto: number;
  xpNeeded: number;
  costumeIds?: string[];
  /** CEFR grade — decides the tree species; promotion transforms the garden. */
  species?: CefrLevel;
  /** Today's quest row id once it is done — the tree says thank you once
      per watered quest, the first time the Garden opens afterwards. */
  celebrateKey?: string | null;
  /** Today's review, for the watering can; no can when absent. */
  review?: { due: number; cap: number; doneToday: boolean };
}) {
  const t = useTranslations("dashboard.tree");
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFill(progressPct), 200);
    return () => clearTimeout(timer);
  }, [progressPct]);

  // The thank-you plays once per watered quest, the first time the Garden
  // opens after it: the quest row's id is the latch (localStorage), so a
  // reload or a second visit that day doesn't replay it, and tomorrow's
  // quest gets its own. Four wider sways, the "thanks for the water" line
  // held up front, two sparkles by the crown, the watering-can sound.
  const [party, setParty] = useState(false);
  useEffect(() => {
    if (!celebrateKey) return;
    const key = `kroot:quest-cheered:${celebrateKey}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* private mode etc. — cheer anyway, just not latched */
    }
    // a beat after the card paints, so the cheer is seen starting rather
    // than already under way (and setState stays out of the effect body)
    const start = setTimeout(() => {
      setParty(true);
      playWater();
    }, 400);
    const stop = setTimeout(() => setParty(false), 4600);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
    };
  }, [celebrateKey]);

  const stage = treeStageForLevel(level);
  const maxed = level >= MAX_LEVEL;
  // Same stage My room draws (GardenStage): veteran trunk, sky costume,
  // ground items, friends. The tree's width is clamp()ed off the viewport
  // (AGENTS.md rule 2); the card grows with a veteran's taller frame so
  // the crown never leaves the picture — 214px until about Lv.60, then a
  // few px per level, measured 329px at 360 and 359px at 430 for Lv.120.
  const { veteran, frameH, sky } = gardenFrame(level, costumeIds);
  const metres = treeHeightMetres(level);
  const treeWidth = "clamp(112px, 32vw, 128px)";
  const cardHeight = `max(214px, calc(${treeWidth} * ${(frameH / 220).toFixed(3)} + 62px))`;
  const lines = TREE_PHRASES.map((p) => ({ kr: p.kr, en: t(`phrases.${p.key}`) }));
  // While the tree is thanking you, that line leads and stays up.
  const thanks = lines.filter((p) => p.kr === "물 줘서 고마워요");
  const phrases = party ? [...thanks, ...lines.filter((p) => !thanks.includes(p))] : lines;

  return (
    <div
      data-tour="tree"
      className="relative block rounded-[12px] border border-line overflow-hidden mb-3 shadow-[0_2px_0_var(--c-line)] transition-[transform,box-shadow,border-color] duration-100 ease-out has-[>a:hover]:border-success has-[>a:active]:translate-y-[2px] has-[>a:active]:shadow-[0_0_0_var(--c-line)]"
      style={{ height: cardHeight }}
    >
      {/* The whole card still opens My room, but through a link laid over
          it rather than wrapped around it — the watering can is a button,
          and a button inside a link is invalid and double-fires. */}
      <Link href="/myroom" aria-label={t("openMyRoom")} className="absolute inset-0 z-[5]" />
      <GardenScene hillsHeight="46%" clouds={!sky} className="absolute inset-0 w-full h-full" style={sky ? { background: sky } : undefined}>
        {/* level + stage name, then the species — the two things the band
            had no room for.
            Solid cream, not a translucent one: at 85% over this sky the
            result was #FEFCF5, a channel off #FFFDF6 and invisible, so the
            alpha bought nothing and cost the pill a fixed colour — a
            translucent fill changes shade as it moves across the gradient,
            which is the one thing a flat storybook palette can't have. */}
        <span
          className={`absolute top-3 left-3 z-[4] inline-flex items-center gap-1 rounded-full border bg-cream px-[9px] py-1 text-[11.5px] font-extrabold ${
            veteran ? "border-amber-line text-[#B7791F]" : "border-success-line text-success-deep"
          }`}
        >
          {t("levelBadge", { level })}
          <span className="font-bold text-charcoal tabular-nums">· {veteran ? `${metres} ${t("metresTall")}` : LEVEL_PATH[stage].treeName}</span>
        </span>

        {/* Tree and bubble share one stage, capped at a phone's width and
            centred: at 430px and below it fills the card, and on a tablet
            the pair stays together in the middle instead of the tree
            drifting left and the bubble's tail pointing at empty sky. */}
        <div className="absolute inset-0 mx-auto w-full max-w-[400px]">
          {/* The tree stands a tenth of the way in, on the hills; friends
              wander a shorter way than in My room so they stay in frame. */}
          <div className={`absolute left-[10%] bottom-[34px] ${party ? "cheer" : ""}`}>
            <GardenStage level={level} species={species} costumeIds={costumeIds} width={treeWidth} roamSpan="clamp(40px, 12vw, 64px)" />
          </div>
          {party && (
            <>
              <svg className="bob absolute left-[26%] top-[26%] w-[14px] h-[14px]" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1 L12.2 7.8 L19 10 L12.2 12.2 L10 19 L7.8 12.2 L1 10 L7.8 7.8 Z" fill="#FFD66B" stroke="#E8B93E" strokeWidth="1" />
              </svg>
              <svg className="bob2 absolute left-[44%] top-[44%] w-[10px] h-[10px]" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1 L12.2 7.8 L19 10 L12.2 12.2 L10 19 L7.8 12.2 L1 10 L7.8 7.8 Z" fill="#FFD66B" stroke="#E8B93E" strokeWidth="1" />
              </svg>
            </>
          )}

          {/* review: a watering can on the grass, bottom-right; tapping it
              waters this tree (the same sway and thank-you a done quest
              gets) and opens /review */}
          {review && (
            <WateringCan
              due={review.due}
              cap={review.cap}
              doneToday={review.doneToday}
              onPour={() => setParty(true)}
              className="absolute right-[clamp(12px,3.5vw,18px)] bottom-[36px]"
              style={{ width: "clamp(50px, 14vw, 60px)" }}
            />
          )}
          {/* the tail points back at the tree; keyed so the thank-you
              restarts the cycle from its first line */}
          <SpeechBubble
            key={party ? "cheer" : "calm"}
            phrases={phrases}
            firstHoldMs={party ? 4200 : undefined}
            variant="card"
            className="absolute top-[58px] right-[22px]"
          />
        </div>

        {/* XP, pinned to the card's own bottom edge */}
        <div className="absolute left-[14px] right-[14px] bottom-[10px] z-[4]">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-success-deep tabular-nums">
            <span>{maxed ? t("maxed") : `${xpInto}/${xpNeeded} XP`}</span>
            {!maxed && <span>{t("levelBadge", { level: level + 1 })} →</span>}
          </div>
          {/* 70% cream over the hills resolved to #F5FAF1 — a pale mint with
              its green channel above its red, i.e. not cream at all. Solid. */}
          <span className="mt-[3px] block h-[6px] rounded-full overflow-hidden bg-cream">
            <i
              className={`not-italic block h-full rounded-full transition-[width] duration-1000 ${veteran ? "bg-[#B7791F]" : "bg-success"}`}
              style={{ width: `${maxed ? 100 : fill}%` }}
            />
          </span>
        </div>
      </GardenScene>
    </div>
  );
}
