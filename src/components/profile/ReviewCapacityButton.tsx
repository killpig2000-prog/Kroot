"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { dailyReviewCap, reviewCapacityTiers } from "@/lib/srs";

// Free daily-cap picker (0/10/20/30 bonus → 10/20/30/40 a day) — set_review_
// capacity() (migration 0058) just writes the choice, no coin cost.
export default function ReviewCapacityButton({ capacityBonus }: { capacityBonus: number }) {
  const t = useTranslations("ui.account.reviewCapacity");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [bonus, setBonus] = useState(capacityBonus);
  const [target, setTarget] = useState(capacityBonus);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const tiers = useMemo(() => [0, ...reviewCapacityTiers()], []);
  const dirty = target !== bonus;

  async function apply() {
    if (busy || !dirty) return;
    setBusy(true);
    setMsg(null);
    try {
      const { data, error } = await supabase.rpc("set_review_capacity", { p_target_bonus: target });
      if (error) {
        setMsg(error.message.includes("not authenticated") ? t("errAuth") : t("errGeneric"));
      } else {
        const now = typeof data === "number" ? data : target;
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
            {t("capacity", { count: dailyReviewCap(bonus) })}
          </span>
        </b>
        {msg && <span className="block text-[11.5px] mt-0.5 text-success-deep">{msg}</span>}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="rounded-[9px] border border-line bg-cream px-2 py-1.5 text-[12.5px] font-semibold text-charcoal"
        >
          {tiers.map((tier) => (
            <option key={tier} value={tier}>
              {dailyReviewCap(tier)}/day
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={apply}
          disabled={busy || !dirty}
          className="flex-none rounded-[9px] bg-success px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-success-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? t("buying") : t("buy")}
        </button>
      </div>
    </div>
  );
}
