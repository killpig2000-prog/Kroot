"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { MAX_WORD_BANK_SLOTS, SLOTS_PER_PURCHASE, SLOTS_PRICE } from "@/lib/word-bank";

// Permanent upgrade: +10 word-bank slots for 200 coins, up to 60. The cap is
// enforced in buy_word_bank_slots() (migration 0039) — this card only mirrors
// it, so a stale page can't spend coins for nothing.
export default function WordBankSlotsCard({
  slots: held,
  coins,
  isAdmin,
}: {
  slots: number;
  coins: number;
  isAdmin: boolean;
}) {
  const t = useTranslations("vocabulary");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [slots, setSlots] = useState(held);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const maxed = slots >= MAX_WORD_BANK_SLOTS;
  const affordable = isAdmin || coins >= SLOTS_PRICE;
  const next = Math.min(slots + SLOTS_PER_PURCHASE, MAX_WORD_BANK_SLOTS);

  async function buy() {
    if (busy || maxed) return;
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("buy_word_bank_slots");
    if (error) {
      setMsg(
        error.message.includes("not enough coins")
          ? t("slots.errNotEnough")
          : error.message.includes("max slots")
            ? t("slots.errMax", { max: MAX_WORD_BANK_SLOTS })
            : error.message.includes("not authenticated")
              ? t("slots.errAuth")
              : t("slots.errGeneric")
      );
    } else {
      const now = typeof data === "number" ? data : next;
      setSlots(now);
      setMsg(t("slots.bought", { slots: now }));
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="max-w-[1040px] border border-success-line bg-success-bg rounded-[14px] px-5 py-4 mb-5 flex items-center gap-4 flex-wrap">
      <span className="flex-none w-12 h-12 rounded-[12px] bg-cream border border-success-line flex items-center justify-center text-[24px]">
        📓
      </span>
      <div className="flex-1 min-w-[220px]">
        <b className="font-semibold text-[14.5px] text-success-deep flex items-center gap-2 flex-wrap">
          {t("slots.title")}
          <span className="text-[11px] font-bold text-success-deep bg-cream border border-success-line rounded-full px-2 py-px tabular-nums">
            {t("slots.capacity", { slots, max: MAX_WORD_BANK_SLOTS })}
          </span>
        </b>
        <span className="text-[13px] text-success-deep">
          {maxed
            ? t("slots.atMax", { max: MAX_WORD_BANK_SLOTS })
            : t("slots.upgrade", { from: slots, to: next })}
        </span>
        {msg && <span className="block text-[12.5px] mt-1 text-success-deep">{msg}</span>}
      </div>
      <button
        type="button"
        onClick={buy}
        disabled={busy || maxed || !affordable}
        className="rounded-[10px] bg-success px-4 py-2.5 text-[13px] font-bold text-white hover:bg-success-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {maxed ? t("slots.maxed") : busy ? t("slots.buying") : t("slots.buy", { price: SLOTS_PRICE })}
      </button>
    </div>
  );
}
