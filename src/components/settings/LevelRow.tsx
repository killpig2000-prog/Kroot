"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { setMyLevel } from "@/lib/set-level";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import BottomSheet, { SheetOption } from "@/components/settings/BottomSheet";
import { ButtonRow } from "@/components/settings/SettingsList";

// "My level · A2 ›" — the level is the learner's own choice, up or down, any
// number of times. Picking writes it at once, like every other settings sheet.
export default function LevelRow({ userId, level: initial }: { userId: string; level: CefrLevel }) {
  const t = useTranslations("settings");
  const tl = useTranslations("common.levels");
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [level, setLevel] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  async function pick(next: CefrLevel) {
    if (busy) return;
    if (next === level) {
      setOpen(false);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await setMyLevel(supabase, userId, next);
      setLevel(next);
      setOpen(false);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ButtonRow
        title={t("levelTitle")}
        desc={t("levelOpens", { level })}
        value={level}
        onClick={() => setOpen(true)}
      />
      <BottomSheet open={open} onClose={close} title={t("levelTitle")}>
        <p className="px-3 pb-2 text-[12.5px] text-muted leading-snug">
          {t("levelSheetNote")} {t("levelCoinNote")}
        </p>
        {LEVEL_ORDER.map((lv) => (
          <SheetOption
            key={lv}
            label={lv}
            sub={tl(lv)}
            selected={lv === level}
            onPick={() => void pick(lv)}
            disabled={busy}
          />
        ))}
        {failed ? <p className="px-3 pt-1 pb-2 text-[12.5px] font-semibold text-danger">{t("saveFailed")}</p> : null}
      </BottomSheet>
    </>
  );
}
