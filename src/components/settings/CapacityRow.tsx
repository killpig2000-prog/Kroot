"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { dailyReviewCap, reviewCapacityTiers } from "@/lib/srs";
import BottomSheet, { SheetOption } from "@/components/settings/BottomSheet";
import { ButtonRow } from "@/components/settings/SettingsList";

// "Words to review a day · 10 ›". This used to be a chip, a <select> and a
// Set button — the only Save button on the whole Settings page. Now the row
// opens a sheet and picking a tier writes it at once through the same
// set_review_capacity() RPC (migration 0058; free, no coin cost). The row
// shows the new number the moment the server confirms it.
export default function CapacityRow({ capacityBonus }: { capacityBonus: number }) {
  const t = useTranslations("settings");
  const tc = useTranslations("ui.account.reviewCapacity");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [bonus, setBonus] = useState(capacityBonus);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const tiers = useMemo(() => [0, ...reviewCapacityTiers()], []);

  async function pick(target: number) {
    if (busy) return;
    if (target === bonus) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const { data, error } = await supabase.rpc("set_review_capacity", { p_target_bonus: target });
      if (error) {
        setErr(error.message.includes("not authenticated") ? tc("errAuth") : tc("errGeneric"));
      } else {
        setBonus(typeof data === "number" ? data : target);
        setOpen(false);
        router.refresh();
      }
    } catch {
      setErr(tc("errGeneric"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ButtonRow
        title={t("capacityTitle")}
        value={String(dailyReviewCap(bonus))}
        onClick={() => setOpen(true)}
      />
      <BottomSheet open={open} onClose={() => setOpen(false)} title={t("capacityPick")}>
        {tiers.map((tier) => (
          <SheetOption
            key={tier}
            label={t("capacityOption", { count: dailyReviewCap(tier) })}
            selected={tier === bonus}
            onPick={() => void pick(tier)}
            disabled={busy}
          />
        ))}
        {err ? <p className="px-3 pt-1 pb-2 text-[12.5px] font-semibold text-danger">{err}</p> : null}
      </BottomSheet>
    </>
  );
}
