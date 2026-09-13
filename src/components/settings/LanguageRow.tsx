"use client";

import { useCallback, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { LANGUAGES, rememberLocale } from "@/i18n/locale";
import BottomSheet, { SheetOption } from "@/components/settings/BottomSheet";
import { ButtonRow } from "@/components/settings/SettingsList";

// "Interface language · English ›" — the row shows the current language and
// opens a sheet to pick another. The switch itself is the sidebar's: remember
// the choice, then let next-intl's router re-render this same path under the
// new locale. It's a full RSC round-trip, so the row shows the incoming
// language with an ellipsis until it lands.
export default function LanguageRow() {
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  function pick(code: string, label: string) {
    setOpen(false);
    if (code === locale) return;
    rememberLocale(code);
    setPendingLabel(label);
    startTransition(() => {
      router.replace("/settings/learning", { locale: code });
    });
  }

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <ButtonRow
        title={t("language")}
        value={isPending && pendingLabel ? `${pendingLabel}…` : current.label}
        onClick={() => setOpen(true)}
        disabled={isPending}
      />
      <BottomSheet open={open} onClose={close} title={t("language")}>
        {LANGUAGES.map((l) => (
          <SheetOption key={l.code} label={l.label} selected={l.code === locale} onPick={() => pick(l.code, l.label)} />
        ))}
      </BottomSheet>
    </>
  );
}
