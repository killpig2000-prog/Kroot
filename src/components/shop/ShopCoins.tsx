"use client";

// The Garden Shop's coin line: balance, how coins are earned, and a way to
// today's quest. This used to be a savings-goal gauge ("100 / 140 🪙 ·
// Saving for …") that auto-picked the cheapest item the balance didn't
// cover; the second number needed explaining and the item cards already
// say what each thing costs, so the gauge is gone.
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export const QUEST_COINS = 10;
// award_xp pays 150 coins at Lv.10, 20, 30, 40 and 50 (this said 50, which
// was never what the server paid).
export const LEVEL_BONUS_COINS = 150;

export default function ShopCoins({
  balance,
  isAdmin,
  questDone,
}: {
  balance: number;
  isAdmin: boolean;
  questDone: boolean;
}) {
  const t = useTranslations("shop");
  const shown = isAdmin ? "∞" : String(balance);
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap px-4 sm:px-5 py-3.5 border-b border-line bg-warm">
      <p data-tour="guided-shop-coins" className="w-fit text-[14px] font-extrabold tabular-nums">
        {t("coins", { coins: shown })}
        <span className="text-[12.5px] font-semibold text-muted ml-2">
          {t("goal.earnNote", { quest: QUEST_COINS, bonus: LEVEL_BONUS_COINS })}
        </span>
      </p>
      {!questDone && !isAdmin && (
        <Link href="/dashboard" className="text-[12.5px] font-bold text-success hover:underline whitespace-nowrap">
          {t("goal.doQuest")}
        </Link>
      )}
    </div>
  );
}
