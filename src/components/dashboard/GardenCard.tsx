"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import GardenScene from "@/components/ui/GardenScene";
import SpeechBubble from "@/components/ui/SpeechBubble";
import GardenStage, { AuraLayer, SkyLayer, gardenFrame } from "@/components/dashboard/GardenStage";
import WateringCan from "@/components/dashboard/WateringCan";
import { TREE_PHRASES } from "@/lib/tree-phrases";
import { playWater } from "@/lib/sfx";
import { LOOK_KEYS, evolutionProgress } from "@/lib/level";
import { lookHeightForLevel } from "@/components/dashboard/LevelCreature";
import type { CefrLevel } from "@/lib/tree";

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
  xp,
  costumeIds = [],
  species,
  celebrateKey = null,
  review,
}: {
  level: number;
  /** Total XP — the XP line counts down to the tree's next look. */
  xp: number;
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
  // The XP line shows the way to the next look, not to the next level
  // (2026-09-12, user call): "213 XP to Sturdy Tree", the bar filling from
  // the current look to the next.
  const evo = evolutionProgress(xp);
  const [fill, setFill] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setFill(evo.pct), 200);
    return () => clearTimeout(timer);
  }, [evo.pct]);

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

  const maxed = evo.nextLook === null;
  // Same stage My room draws (GardenStage): veteran trunk, sky costume,
  // ground items, friends. The tree's width is clamp()ed off the viewport
  // (AGENTS.md rule 2); the card grows with a veteran's taller frame so
  // the crown never leaves the picture. Laid out like My room shrunk
  // (2026-09-10, user call): tree centred, the bubble over it, so the card
  // keeps ~120px above the tree's feet for the pill and the bubble
  // (240px at 360 so the phone Garden still ends above the tab bar).
  const { frameH, sky } = gardenFrame(level, costumeIds);
  // 2026-09-12 (user: "마이룸은 좋은데 대쉬보드에서 캐릭터가 좀 작아"): was
  // 112-128px, about half My room's 218-260. 42vw reaches the 180px cap at
  // 430 and gives 151px at 360; the card height below follows it.
  // 2026-09-12 (user, from the store-screenshot mock: "나무 크기 위치는 실제
  // 적용"): 150-180 → 200-240px, so the tree fills the card's width the way
  // the mock did; 56vw reaches the cap at 430 and gives 200px at 360.
  const treeWidth = "clamp(200px, 56vw, 240px)";
  const cardHeight = `max(240px, calc(${treeWidth} * ${(frameH / 220).toFixed(3)} + 120px))`;
  // The tree's feet, above the XP line at the card's bottom.
  const feet = 26;
  // Where the bubble hangs: just over this look's crown, not at a fixed
  // height — a seed gets its bubble low, the guardian gets it high. In the
  // 230-tall frame the ground line is at 212, so the crown's top sits
  // (230 - 212 + look height) units above the frame's bottom; the frame
  // is treeWidth * 230/220 tall, so one unit is treeWidth / 220.
  const crownUnits = 230 - 212 + lookHeightForLevel(level);
  const bubbleBottom = `calc(${feet + 6}px + ${treeWidth} * ${(crownUnits / 220).toFixed(3)})`;
  const lines = TREE_PHRASES.map((key) => ({ key, text: t(`phrases.${key}`) }));
  // While the tree is thanking you, that line leads and stays up.
  const thanks = lines.filter((p) => p.key === "thanksWater");
  const phrases = (party ? [...thanks, ...lines.filter((p) => !thanks.includes(p))] : lines).map((p) => p.text);

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
        <span className="absolute top-3 left-3 z-[4] inline-flex items-center gap-1 rounded-full border border-success-line bg-cream px-[9px] py-1 text-[11.5px] font-extrabold text-success-deep">
          {t("levelBadge", { level })}
          <span className="font-bold text-charcoal">· {t(`looks.${LOOK_KEYS[evo.look]}`)}</span>
        </span>

        {/* a sky costume's moon, stars, snow or rain, over the whole garden */}
        <SkyLayer costumeIds={costumeIds} />
        {/* an aura's rainbow, aurora or glow, over the whole garden */}
        <AuraLayer costumeIds={costumeIds} />

        {/* Tree and bubble share one stage, capped at a phone's width and
            centred: at 430px and below it fills the card, and on a tablet
            the pair stays together in the middle instead of the tree
            drifting left and the bubble's tail pointing at empty sky. */}
        <div className="absolute inset-0 mx-auto w-full max-w-[400px]">
          {/* The tree stands in the middle, on the hills, as in My room; friends
              wander most of the card's width, as in My room. */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: feet }}>
            <div className={party ? "cheer" : undefined}>
              <GardenStage level={level} species={species} costumeIds={costumeIds} width={treeWidth} roamSpan="clamp(64px, 22vw, 112px)" />
            </div>
          </div>
          {party && (
            <>
              <svg className="bob absolute left-[34%] top-[40%] w-[14px] h-[14px]" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M10 1 L12.2 7.8 L19 10 L12.2 12.2 L10 19 L7.8 12.2 L1 10 L7.8 7.8 Z" fill="#FFD66B" stroke="#E8B93E" strokeWidth="1" />
              </svg>
              <svg className="bob2 absolute left-[62%] top-[52%] w-[10px] h-[10px]" viewBox="0 0 20 20" aria-hidden="true">
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
              className="absolute right-[clamp(12px,3.5vw,18px)]"
              style={{ width: "clamp(50px, 14vw, 60px)", bottom: feet + 2 }}
            />
          )}
          {/* over the tree's crown, tail down, as in My room; keyed so the
              thank-you restarts the cycle from its first line */}
          <div className="absolute z-[4] w-max left-1/2 -translate-x-1/2" style={{ bottom: bubbleBottom }}>
            <SpeechBubble key={party ? "cheer" : "calm"} phrases={phrases} firstHoldMs={party ? 4200 : undefined} wrap />
          </div>
        </div>

        {/* XP, pinned to the card's own bottom edge */}
        <div className="absolute left-[14px] right-[14px] bottom-[10px] z-[4]">
          <div className="flex items-center text-[11px] font-extrabold text-success-deep tabular-nums">
            <span>
              {evo.nextLook === null
                ? t("maxed")
                : t("xpToEvolve", { xp: evo.xpLeft, name: t(`looks.${LOOK_KEYS[evo.nextLook]}`) })}
            </span>
          </div>
          {/* 70% cream over the hills resolved to #F5FAF1 — a pale mint with
              its green channel above its red, i.e. not cream at all. Solid. */}
          <span className="mt-[3px] block h-[6px] rounded-full overflow-hidden bg-cream">
            <i
              className="not-italic block h-full rounded-full transition-[width] duration-1000 bg-success"
              style={{ width: `${maxed ? 100 : fill}%` }}
            />
          </span>
        </div>
      </GardenScene>
    </div>
  );
}
