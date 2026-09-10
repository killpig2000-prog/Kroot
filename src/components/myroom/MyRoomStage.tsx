"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import TreeCard from "@/components/dashboard/TreeCard";
import TreePeek from "@/components/ranking/TreePeek";
import type { WeekRing } from "@/lib/growth-rings";
import { Scene } from "@/components/shop/ShopClient";
import { useWardrobe } from "@/components/shop/useWardrobe";
import {
  COSTUMES,
  GARDEN_SLOTS,
  SKIN_SLOTS,
  SLOT_LABELS,
  WEARABLE_SLOTS,
  isLevelLocked,
  isUpcoming,
  type CostumeSlot,
  type Rarity,
} from "@/lib/costumes";
import type { CefrLevel } from "@/lib/tree";

// My room = the dressing room (2026-09-10 mockup A). The garden up top is
// the try-on: tap a card on the shelf below and the big tree wears it, with
// one Buy/Wear button and Reset under the shelf. The shop page's polaroid
// preview and the old five rows (Shop · Wardrobe · Garden Fair · Word bank ·
// Settings) are what this replaces — Ranking and Settings are tabs of their
// own now, and Wardrobe was the same URL as Shop.

const TABS: CostumeSlot[] = [...WEARABLE_SLOTS, ...GARDEN_SLOTS, ...SKIN_SLOTS];
const RARITY_CHIP: Record<Rarity, string> = {
  common: "bg-warm text-muted",
  rare: "bg-[var(--tint-sky)] text-[#1E4FB0]",
  epic: "bg-[var(--tint-violet)] text-[#57279E]",
  legendary: "bg-[var(--tint-amber)] text-[#8F3D1B]",
};

export default function MyRoomStage({
  tree,
  shop,
  rings,
}: {
  tree: {
    level: number;
    progressPct: number;
    xpInto: number;
    xpNeeded: number;
    species: CefrLevel;
    userId: string;
    displayName: string;
    avatarUrl: string | null;
    coins: number;
    streakDays: number;
    streakFreezes: number;
    /** Today's review, for the watering can. */
    review?: { due: number; cap: number; doneToday: boolean };
  };
  shop: {
    isAdmin: boolean;
    playerLevel: number;
    stage: CefrLevel;
    owned: string[];
    equipped: string[];
    today: string;
  };
  /** The learner's own growth rings, for the tree popup. */
  rings: { weeks: WeekRing[]; today: number };
}) {
  const t = useTranslations("shop");
  const tm = useTranslations("myroom");
  const locale = useLocale();
  const w = useWardrobe({
    userId: tree.userId,
    coins: tree.coins,
    isAdmin: shop.isAdmin,
    playerLevel: shop.playerLevel,
    owned: shop.owned,
    equipped: shop.equipped,
    today: shop.today,
  });
  // Open on the slot most people have something in: the welcome gift is a
  // hat, so Hats when nothing else is worn, else the first worn garden slot.
  const [tab, setTab] = useState<CostumeSlot>(() => (shop.equipped.length > 1 ? "aura" : "hat"));
  const shelf = useRef<HTMLDivElement>(null);
  const [peek, setPeek] = useState(false);

  // Mine and Shop never share a shelf (2026-09-11): owned cards looked the
  // same as ones for sale. Slot chips only list slots that have something.
  const [view, setView] = useState<"mine" | "shop">(() => (shop.owned.length > 0 ? "mine" : "shop"));
  const mine = view === "mine";
  const inView = (slot: CostumeSlot, m: boolean) => w.listFor(slot, COSTUMES).filter((c) => w.ownedSet.has(c.id) === m);
  const countFor = (m: boolean) => TABS.reduce((n, s) => n + inView(s, m).length, 0);
  const slots = TABS.filter((s) => inView(s, mine).length > 0);
  const activeTab = slots.includes(tab) ? tab : (slots[0] ?? tab);
  const items = slots.length ? inView(activeTab, mine) : [];

  // A new tab starts the shelf at its left edge — the previous tab's scroll
  // position would otherwise land you mid-row in a different list.
  useEffect(() => {
    shelf.current?.scrollTo({ left: 0 });
  }, [activeTab, view]);
  const fmtDay = (iso: string) =>
    new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));

  let ctaLabel = "";
  let ctaDisabled = false;
  switch (w.cta.kind) {
    case "pick":
      ctaLabel = t("cta.pick");
      ctaDisabled = true;
      break;
    case "wear":
      ctaLabel = t("cta.wear");
      break;
    case "takeOff":
      ctaLabel = t("cta.takeOff");
      break;
    case "claimAdmin":
      ctaLabel = t("cta.claimAdmin");
      break;
    case "locked":
      ctaLabel = t("cta.unlocksAt", { level: w.cta.level });
      ctaDisabled = true;
      break;
    case "upcoming":
      ctaLabel = t("cta.opensOn", { date: fmtDay(w.cta.date) });
      ctaDisabled = true;
      break;
    case "needMore":
      ctaLabel = t("cta.needMore", { n: w.cta.n });
      ctaDisabled = true;
      break;
    case "claim":
      ctaLabel = t("cta.claim");
      break;
    case "buy":
      ctaLabel = t("cta.buy", { price: w.cta.price });
      break;
  }

  return (
    <>
      <TreeCard
        level={tree.level}
        progressPct={tree.progressPct}
        xpInto={tree.xpInto}
        xpNeeded={tree.xpNeeded}
        costumeIds={w.previewIds}
        species={tree.species}
        userId={tree.userId}
        displayName={tree.displayName}
        avatarUrl={tree.avatarUrl}
        coins={w.balance}
        streakDays={tree.streakDays}
        streakFreezes={tree.streakFreezes}
        onTreeTap={() => setPeek(true)}
        review={tree.review}
        showOwner={false}
      />
      {peek && (
        <TreePeek
          name={tree.displayName}
          avatarUrl={tree.avatarUrl}
          level={tree.level}
          species={tree.species}
          costumeIds={w.previewIds}
          isMe
          rings={rings}
          onClose={() => setPeek(false)}
        />
      )}

      <section className="max-w-[560px] xl:max-w-[760px] mt-3" aria-label={tm("shop")}>
        {/* Mine | Shop */}
        <div role="tablist" className="grid grid-cols-2 gap-[3px] p-[3px] rounded-[12px] bg-line/50 mb-2.5">
          {(["mine", "shop"] as const).map((v) => {
            const on = view === v;
            return (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setView(v)}
                className={`h-[44px] rounded-[9px] inline-flex items-center justify-center gap-1.5 text-[14.5px] font-extrabold transition-colors ${
                  on ? "bg-cream text-charcoal shadow-[0_1px_0_var(--c-line)]" : "text-muted hover:text-charcoal"
                }`}
              >
                {v === "mine" ? tm("mine") : tm("shop")}
                <span className="text-[12px] font-bold text-faint tabular-nums">{countFor(v === "mine")}</span>
              </button>
            );
          })}
        </div>

        {/* what you're trying on, and — only where you spend them — coins */}
        {(!mine || (w.dirty && w.selected)) && (
          <div className="flex items-center gap-2 mb-2 min-h-[26px]">
            <span className="flex-1 min-w-0 truncate text-[13px] font-bold text-muted">
              {w.dirty && w.selected
                ? tm("tryingOn", { name: w.selected.name }).replace(/^·\s*/, "")
                : slots.length > 0 && tm("forSale", { n: items.length })}
            </span>
            {!mine && (
              <span className="flex-none text-[12.5px] font-bold text-[#8F3D1B] bg-[var(--tint-amber)] border border-amber-line rounded-full px-2.5 py-0.5 tabular-nums">
                {t("coins", { coins: shop.isAdmin ? "∞" : String(w.balance) })}
              </span>
            )}
          </div>
        )}

        {/* slot chips — scroll sideways, never wrap */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1 -mx-[clamp(18px,3vw,36px)] px-[clamp(18px,3vw,36px)] xl:mx-0 xl:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label={t("categories")}
        >
          {slots.map((slot) => {
            const on = slot === activeTab;
            const wornHere = !!w.worn[slot];
            return (
              <button
                key={slot}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(slot)}
                className={`flex-none inline-flex items-center gap-1.5 h-[34px] rounded-full px-3 text-[12.5px] font-bold border transition-colors ${
                  on
                    ? "bg-success text-white border-success shadow-[0_2px_0_var(--c-success-deep)]"
                    : "bg-cream text-muted border-line hover:border-faint"
                }`}
              >
                <span aria-hidden="true">{SLOT_LABELS[slot].icon}</span>
                {t(`slots.${slot}`)}
                {wornHere && <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${on ? "bg-white/80" : "bg-success"}`} />}
              </button>
            );
          })}
        </div>

        {/* the shelf */}
        <div
          ref={shelf}
          className="flex gap-2.5 overflow-x-auto snap-x snap-mandatory pt-2 pb-2.5 -mx-[clamp(18px,3vw,36px)] px-[clamp(18px,3vw,36px)] xl:mx-0 xl:px-0.5 xl:pb-3 [scrollbar-width:none] xl:[scrollbar-width:thin] [&::-webkit-scrollbar]:hidden xl:[&::-webkit-scrollbar]:block xl:[&::-webkit-scrollbar]:h-1.5 xl:[&::-webkit-scrollbar-thumb]:bg-line xl:[&::-webkit-scrollbar-thumb]:rounded-full"
        >
          {items.map((c) => {
            const on = w.preview[c.slot] === c.id;
            const wearing = w.worn[c.slot] === c.id;
            const locked = isLevelLocked(c, shop.playerLevel);
            const ids = Object.values({ ...w.preview, [c.slot]: c.id }).filter((v): v is string => !!v);
            let price: React.ReactNode;
            if (mine)
              price = <span className="text-[12px] font-extrabold text-success whitespace-nowrap">{wearing ? t("card.wearing") : tm("tapToTry")}</span>;
            else if (isUpcoming(c, w.now) && c.availableFrom)
              price = <span className="text-[11px] font-extrabold text-[#B7791F] whitespace-nowrap">{t("card.opens")}</span>;
            else if (locked)
              price = <span className="text-[12px] font-extrabold text-faint whitespace-nowrap">{t("card.locked", { level: c.minPlayerLevel ?? 0 })}</span>;
            else
              price = (
                <span className="rounded-full border border-amber-line bg-[var(--tint-amber)] px-2 py-px text-[12px] font-extrabold text-[#8F3D1B] tabular-nums whitespace-nowrap">
                  {c.price === 0 ? t("card.free") : t("card.price", { price: c.price })}
                </span>
              );
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => w.toggle(c)}
                aria-pressed={on}
                className={`relative flex-none snap-start w-[clamp(134px,38vw,150px)] text-left border rounded-[12px] overflow-hidden transition-all active:translate-y-[1px] ${
                  mine ? "bg-success-bg" : "bg-cream"
                } ${
                  on
                    ? "border-success shadow-[0_2px_0_var(--c-success)]"
                    : mine
                    ? "border-success-line shadow-[0_2px_0_var(--c-success-line)] hover:border-success"
                    : "border-line shadow-[0_2px_0_var(--c-line)] hover:border-faint"
                }`}
              >
                {mine && wearing && (
                  <span aria-hidden="true" className="absolute top-1.5 right-1.5 z-[1] w-5 h-5 rounded-full bg-success text-white text-[11px] font-black grid place-items-center">
                    ✓
                  </span>
                )}
                <Scene ids={ids} stage={shop.stage} species={tree.species} className="h-[92px]" />
                <span className="block px-2.5 pt-2 pb-2.5">
                  <b className="block text-[13px] leading-tight truncate">{c.name}</b>
                  <small className="block kr text-[11.5px] text-muted truncate">{c.krName}</small>
                  <span className="flex items-center justify-between gap-1.5 mt-1.5">
                    <span className={`text-[9.5px] font-extrabold tracking-[.04em] uppercase rounded px-1 py-px whitespace-nowrap ${RARITY_CHIP[c.rarity]}`}>
                      {t(`rarity.${c.rarity}`)}
                    </span>
                    {price}
                  </span>
                </span>
              </button>
            );
          })}
          {/* See all = the shelf's last tile, not a header link */}
          {!mine && items.length > 0 && (
            <Link
              href="/shop"
              className="flex-none snap-start w-[clamp(96px,26vw,112px)] grid place-items-center text-center rounded-[12px] border-[1.5px] border-dashed border-line px-2 text-[13px] font-extrabold text-success hover:border-success hover:text-success-deep"
            >
              {tm("seeAll")} ›
            </Link>
          )}
          {items.length === 0 &&
            (mine ? (
              <p className="text-[13px] text-muted py-6">
                {tm("mineEmpty")}{" "}
                <button type="button" onClick={() => setView("shop")} className="font-extrabold text-success hover:text-success-deep">
                  {tm("toShop")}
                </button>
              </p>
            ) : (
              <p className="text-[13px] text-muted py-6">{t("empty")}</p>
            ))}
        </div>

        {/* one button makes the tree's outfit real (wear / buy / take off),
            Reset puts the preview back, and Take everything off previews the
            bare tree — nothing is worn or removed until the first button. */}
        {(w.dirty || w.previewIds.length > 0) && (
          <div className="flex flex-wrap gap-2 mt-1">
            {w.dirty && (
            <button
              type="button"
              onClick={() => void w.act()}
              disabled={w.busy || ctaDisabled}
              className="flex-1 rounded-[12px] px-3 py-2.5 text-[13.5px] font-extrabold text-white bg-success shadow-[0_2px_0_var(--c-success-deep)] hover:bg-success-deep active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {w.busy ? "…" : ctaLabel}
            </button>
            )}
            {w.dirty && (
            <button
              type="button"
              onClick={w.reset}
              className="rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-extrabold border border-line bg-cream shadow-[0_2px_0_var(--c-line)] hover:border-faint active:translate-y-[1px] active:shadow-none transition-all"
            >
              {t("tryOn.reset")}
            </button>
            )}
            {w.previewIds.length > 0 && (
              <button
                type="button"
                onClick={w.takeAllOff}
                className="rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-extrabold border border-line bg-cream text-muted shadow-[0_2px_0_var(--c-line)] hover:border-faint hover:text-charcoal active:translate-y-[1px] active:shadow-none transition-all"
              >
                {tm("takeAllOff")}
              </button>
            )}
          </div>
        )}
        {w.message && (
          <p role="status" className={`text-[12.5px] mt-2 ${w.message.good ? "text-success font-semibold" : "text-muted"}`}>
            {t(w.message.key, w.message.params)}
          </p>
        )}
      </section>
    </>
  );
}
