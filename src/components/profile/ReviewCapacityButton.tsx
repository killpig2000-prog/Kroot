"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_REVIEW_CAPACITY_BONUS, dailyReviewCap, reviewCapacityTiers } from "@/lib/srs";

// Permanent upgrade, picked by tier (10/20/30 daily, not one +5 click at a
// time) — buy_review_capacity(target_bonus) (migration 0057) charges the
// cumulative price for every 10-block between the current bonus and the
// chosen tier. Mirrors WordBankSlotsCard's pricing (200 coins/10) but as a
// picker since there's more than one size to jump to.
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

  // reviewCapacityTiers() prices are cumulative from zero bonus, so the
  // actual charge for a jump is the target's price minus the current tier's.
  const allTiers = reviewCapacityTiers();
  const priceAt = (b: number) => allTiers.find((tier) => tier.bonus === b)?.price ?? 0;
  const availableTiers = useMemo(
    () => allTiers.filter((tier) => tier.bonus > bonus).map((tier) => ({ bonus: tier.bonus, delta: tier.price - priceAt(bonus) })),
    [bonus] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const maxed = bonus >= MAX_REVIEW_CAPACITY_BONUS;
  const [target, setTarget] = useState<number>(availableTiers[0]?.bonus ?? bonus);
  const selected = availableTiers.find((tier) => tier.bonus === target) ?? availableTiers[0];
  const affordable = isAdmin || (selected ? coins >= selected.delta : false);
  const cap = dailyReviewCap(bonus);

  async function buy() {
    if (busy || maxed || !selected) return;
    setBusy(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc("buy_review_capacity", { p_target_bonus: selected.bonus });
      if (error) {
        setMsg(
          error.message.includes("not enough coins")
            ? t("errNotEnough")
            : error.message.includes("not authenticated")
              ? t("errAuth")
              : t("errGeneric")
        );
      } else {
        const now = typeof data === "number" ? data : selected.bonus;
        setBonus(now);
        setTarget(now);
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
        {msg && <span className="block text-[11.5px] mt-0.5 text-success-deep">{msg}</span>}
      </div>

      {maxed ? (
        <span className="text-[12px] text-faint">{t("atMax", { max: dailyReviewCap(MAX_REVIEW_CAPACITY_BONUS) })}</span>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="rounded-[9px] border border-line bg-cream px-2 py-1.5 text-[12.5px] font-semibold text-charcoal"
          >
            {availableTiers.map((tier) => (
              <option key={tier.bonus} value={tier.bonus}>
                {dailyReviewCap(tier.bonus)}/day
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={buy}
            disabled={busy || !selected || !affordable}
            className="flex-none rounded-[9px] bg-success px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? t("buying") : t("buy", { step: selected?.bonus ? selected.bonus - bonus : 0, price: selected?.delta ?? 0 })}
          </button>
        </div>
      )}
    </div>
  );
}
