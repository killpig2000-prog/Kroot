"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SettingsButtonRow } from "@/components/settings/SettingsCard";
import Glyph from "@/components/dashboard/Glyph";

// Deleting an account is the one control on this page that can't be undone,
// so it asks twice: once to open the panel, and once by making the learner
// type the word. The confirmation word is translated, but the string the
// server checks is always "DELETE" — a locale mismatch must never be the
// thing standing between someone and their own data.
export default function DeleteAccountRow({ streakDays }: { streakDays: number }) {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const word = t("deleteWord");
  const armed = typed.trim().toUpperCase() === word.toUpperCase();

  async function remove() {
    if (!armed || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      if (!res.ok) {
        setFailed(true);
        return;
      }
      // Full reload rather than a router push: every cached RSC payload in
      // this tab belongs to an account that no longer exists.
      window.location.assign("/");
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-t border-dashed border-line pt-3.5">
      <SettingsButtonRow
        icon={<Glyph name="warning" className="w-[18px] h-[18px] text-danger" />}
        title={t("deleteAccount")}
        desc={t("deleteDesc")}
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        danger
      />

      {open && (
        <div className="mt-3 rounded-[12px] border border-danger/40 bg-danger-bg p-4">
          <b className="block text-[14px] font-bold text-danger">{t("deleteConfirmTitle")}</b>
          <p className="mt-1 text-[12.5px] text-charcoal leading-snug">
            {t("deleteConfirmBody", { streak: streakDays })}
          </p>

          <label className="mt-3 block text-[12.5px] font-semibold text-charcoal">
            {t("deleteTypePrompt", { word })}
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="mt-1.5 w-full max-w-[220px] rounded-[12px] border border-line bg-cream px-3 py-2 text-[14px] font-semibold text-charcoal focus:outline-none focus:border-danger transition-colors"
            />
          </label>

          {failed && <p className="mt-2 text-[12.5px] font-semibold text-danger">{t("deleteFailed")}</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={remove}
              disabled={!armed || busy}
              className="rounded-[12px] bg-danger px-3.5 py-2 text-[12.5px] font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? t("deleting") : t("deleteGo")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setFailed(false);
              }}
              disabled={busy}
              className="rounded-[12px] border border-line bg-cream px-3.5 py-2 text-[12.5px] font-bold text-charcoal hover:bg-warm transition-colors disabled:opacity-60"
            >
              {t("deleteCancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
