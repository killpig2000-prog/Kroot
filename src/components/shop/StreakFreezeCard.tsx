"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { QUEST_COINS } from "@/components/shop/ShopGoal";

export const FREEZE_PRICE = 150;
export const FREEZE_MAX = 3;

// Consumable: one freeze covers one missed day so the streak survives.
// Spent automatically by touch_streak() (migration 0035). Freezes used to
// stack on top of the Kroot Plus shield; Plus is gone, so they are now the
// only thing standing between a missed day and a broken streak.
export default function StreakFreezeCard({
  held,
  coins,
  isAdmin,
  streakDays,
}: {
  held: number;
  coins: number;
  isAdmin: boolean;
  streakDays: number;
}) {
  const t = useTranslations("shop.freeze");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [count, setCount] = useState(held);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const full = count >= FREEZE_MAX;
  const affordable = isAdmin || coins >= FREEZE_PRICE;

  async function buy() {
    if (busy || full) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("buy_streak_freeze");
    if (error) {
      setMsg(
        error.message.includes("not enough coins")
          ? t("errNotEnough", { coins: QUEST_COINS })
          : error.message.includes("max freezes")
            ? t("errMax", { max: FREEZE_MAX })
            : error.code === "PGRST202"
              ? t("errPending")
              : t("errGeneric")
      );
    } else {
      setCount(typeof data === "number" ? data : count + 1);
      setMsg(t("bought"));
      track("streak_freeze_bought", { held: count + 1 });
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="max-w-[1040px] border border-[var(--tint-sky-line)] bg-[var(--tint-sky)] rounded-[14px] px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
      <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-[var(--tint-sky-line)] flex items-center justify-center text-[24px]">
        🧊
      </span>
      <div className="flex-1 min-w-[220px]">
        <b className="font-semibold text-[14.5px] text-sky-deep flex items-center gap-2 flex-wrap">
          {t("title")}
          <span className="text-[11px] font-bold text-sky-deep bg-cream border border-[var(--tint-sky-line)] rounded-full px-2 py-px">
            {t("held", { n: count, max: FREEZE_MAX })}
          </span>
        </b>
        <span className="text-[13px] text-sky-deep">
          {streakDays > 0 ? t("descStreak", { n: streakDays }) : t("desc")}
        </span>
        {msg && <span className="block text-[12.5px] mt-1 text-sky-deep">{msg}</span>}
      </div>
      <button
        type="button"
        onClick={buy}
        disabled={busy || full || !affordable}
        className="rounded-[10px] bg-[#1F81B4] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#0369A1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {full ? t("maxed") : busy ? t("buying") : t("buy", { price: FREEZE_PRICE })}
      </button>
    </div>
  );
}
