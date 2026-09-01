"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_REVIEW_CAPACITY_BONUS,
  REVIEW_CAPACITY_PER_PURCHASE,
  REVIEW_CAPACITY_PRICE,
  dailyReviewCap,
} from "@/lib/srs";

// Permanent upgrade: +5 daily review slots for 100 coins, up to +20 (30/day
// total). Mirrors WordBankSlotsCard's shape exactly; the cap is enforced in
// buy_review_capacity() (migration 0056) — this only reflects it.
export default function ReviewCapacityButton({
  capacityBonus,
  coins,
  isAdmin,
}: {
  capacityBonus: number;
  coins: number;
  isAdmin: boolean;
}) {
  const t = useTranslations("ui.account.reviewCapacity");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [bonus, setBonus] = useState(capacityBonus);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const maxed = bonus >= MAX_REVIEW_CAPACITY_BONUS;
  const affordable = isAdmin || coins >= REVIEW_CAPACITY_PRICE;
  const cap = dailyReviewCap(bonus);
  const nextCap = dailyReviewCap(Math.min(bonus + REVIEW_CAPACITY_PER_PURCHASE, MAX_REVIEW_CAPACITY_BONUS));

  async function buy() {
    if (busy || maxed) return;
    setBusy(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc("buy_review_capacity");
      if (error) {
        setMsg(
          error.message.includes("not enough coins")
            ? t("errNotEnough")
            : error.message.includes("max capacity")
              ? t("errMax", { max: MAX_REVIEW_CAPACITY_BONUS })
              : error.message.includes("not authenticated")
                ? t("errAuth")
                : t("errGeneric")
        );
      } else {
        const now = typeof data === "number" ? data : Math.min(bonus + REVIEW_CAPACITY_PER_PURCHASE, MAX_REVIEW_CAPACITY_BONUS);
        setBonus(now);
        setMsg(t("bought", { count: dailyReviewCap(now) }));
        router.refresh();
      }
    } catch {
      setMsg(t("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 mt-4 pt-3.5 border-t border-dashed border-line flex-wrap">
      <div className="min-w-[180px]">
        <b className="font-semibold text-[13px] flex items-center gap-2 flex-wrap">
          {t("title")}
          <span className="text-[10.5px] font-bold text-faint bg-warm border border-line rounded-full px-2 py-px tabular-nums">
            {t("capacity", { count: cap })}
          </span>
        </b>
        <span className="text-[12px] text-faint">
          {maxed ? t("atMax", { max: dailyReviewCap(MAX_REVIEW_CAPACITY_BONUS) }) : t("upgrade", { from: cap, to: nextCap })}
        </span>
        {msg && <span className="block text-[11.5px] mt-0.5 text-success-deep">{msg}</span>}
      </div>
      <button
        type="button"
        onClick={buy}
        disabled={busy || maxed || !affordable}
        className="flex-none rounded-[9px] bg-success px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {maxed
          ? t("maxed")
          : busy
            ? t("buying")
            : t("buy", { step: REVIEW_CAPACITY_PER_PURCHASE, price: REVIEW_CAPACITY_PRICE })}
      </button>
    </div>
  );
}
