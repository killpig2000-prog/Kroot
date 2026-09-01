"use client";

// Coin-goal header for the Garden Shop: "45 / 95 🪙 · Saving for Firefly
// Glow", a sun-yellow gauge, and how many daily quests (or which 10th-level
// bonus) closes the gap. Pure presentation — goal selection lives in
// ShopClient, where the catalog/ownership state is.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import type { Costume } from "@/lib/costumes";

export const QUEST_COINS = 10;
export const LEVEL_BONUS_COINS = 50;
export const GOAL_STORAGE_KEY = "kroot.shop.goal";

// The user's chosen goal is a localStorage-only preference. Read through
// useSyncExternalStore so the server render (and hydration) see "no
// override" and the stored id swaps in right after, with no setState-in-effect.
const listeners = new Set<() => void>();
function subscribeGoal(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readStoredGoal(): string | null {
  try {
    return localStorage.getItem(GOAL_STORAGE_KEY);
  } catch {
    return null;
  }
}
export function writeStoredGoal(id: string | null) {
  try {
    if (id) localStorage.setItem(GOAL_STORAGE_KEY, id);
    else localStorage.removeItem(GOAL_STORAGE_KEY);
  } catch {
    /* storage unavailable — the goal just won't persist */
  }
  listeners.forEach((l) => l());
}
/** Stored goal item id, or null (always null on the server / during hydration). */
export function useStoredGoal(): string | null {
  return useSyncExternalStore(subscribeGoal, readStoredGoal, () => null);
}

/** Next multiple of 10 above the player's level (Lv.12 → 20, Lv.20 → 30). */
export function nextBonusLevel(playerLevel: number): number {
  return Math.floor(playerLevel / 10) * 10 + 10;
}

export function questsToGo(price: number, balance: number): number {
  return Math.max(0, Math.ceil((price - balance) / QUEST_COINS));
}

export default function ShopGoal({
  goal,
  balance,
  isAdmin,
  playerLevel,
  locked,
  questDone,
  preview,
  picker,
  onBuyNow,
}: {
  goal: Costume | null;
  balance: number;
  isAdmin: boolean;
  playerLevel: number;
  /** Goal needs a higher Lv. than the player has (can still be saved for). */
  locked: boolean;
  questDone: boolean;
  /** Thumbnail of the goal item, drawn by the caller (needs the tree scene). */
  preview?: ReactNode;
  /** The "Change ▾" control, drawn by the caller. */
  picker?: ReactNode;
  onBuyNow: () => void;
}) {
  const t = useTranslations("shop");
  const shown = isAdmin ? "∞" : String(balance);

  if (!goal || isAdmin) {
    return (
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3.5 border-b border-line bg-warm">
        <p className="text-[14px] font-extrabold tabular-nums">
          {t("coins", { coins: shown })}
          <span className="text-[12.5px] font-semibold text-muted ml-2">
            {t("goal.earnNote", { quest: QUEST_COINS, bonus: LEVEL_BONUS_COINS })}
          </span>
        </p>
        {!questDone && (
          <Link href="/dashboard" className="text-[12.5px] font-bold text-success hover:underline whitespace-nowrap">
            {t("goal.doQuest")}
          </Link>
        )}
      </div>
    );
  }

  const remaining = Math.max(0, goal.price - balance);
  const pct = goal.price > 0 ? Math.min(100, Math.round((balance / goal.price) * 100)) : 100;
  const affordable = remaining === 0;
  const quests = questsToGo(goal.price, balance);
  const bonusLv = nextBonusLevel(playerLevel);

  return (
    <div className="px-4 sm:px-5 py-4 border-b border-line bg-warm">
      <div className="grid grid-cols-[auto_1fr] gap-3.5 items-center">
        <span className="w-14 h-14 rounded-[10px] overflow-hidden flex-none border border-line bg-cream" aria-hidden="true">
          {preview}
        </span>
        <div className="min-w-0">
          <p className="text-[22px] leading-none font-extrabold tabular-nums tracking-[-0.02em]">
            {balance} <span className="text-faint font-bold">/ {goal.price}</span> 🪙
          </p>
          <div className="flex items-center gap-2 flex-wrap mt-1.5 text-[13px] text-muted">
            <span className="truncate">
              {t.rich("goal.savingFor", {
                name: goal.name,
                b: (chunks) => <b className="text-charcoal">{chunks}</b>,
              })}
              {goal.minPlayerLevel ? (
                <span className={locked ? "text-[#B7AE9C] font-semibold" : ""}>
                  {t("goal.needsLevel", { level: goal.minPlayerLevel })}
                </span>
              ) : null}
            </span>
            {picker}
          </div>
        </div>
      </div>

      <div
        className="mt-3 h-2.5 rounded-full bg-cream border border-line overflow-hidden"
        role="progressbar"
        aria-label={t("goal.progressLabel", { name: goal.name })}
        aria-valuemin={0}
        aria-valuemax={goal.price}
        aria-valuenow={Math.min(balance, goal.price)}
      >
        <div className="h-full rounded-full bg-sun transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mt-2 text-[12.5px]">
        {affordable ? (
          locked ? (
            <span className="font-bold text-muted">{t("goal.savedLocked", { level: goal.minPlayerLevel ?? 0 })}</span>
          ) : (
            <button type="button" onClick={onBuyNow} className="font-extrabold text-success hover:underline">
              {t("goal.buyNow")}
            </button>
          )
        ) : (
          <span className="text-muted">
            <b className="text-charcoal">{t("goal.questsToGo", { n: quests })}</b>
            {t("goal.orBonus", { level: bonusLv, coins: LEVEL_BONUS_COINS })}
          </span>
        )}
        {questDone ? (
          <span className="text-faint font-semibold whitespace-nowrap">{t("goal.questDone")}</span>
        ) : (
          <Link href="/dashboard" className="font-bold text-success hover:underline whitespace-nowrap">
            {t("goal.questReady")}
          </Link>
        )}
      </div>
    </div>
  );
}
