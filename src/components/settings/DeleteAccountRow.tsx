"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ButtonRow, Sheet } from "@/components/settings/SettingsList";

// Deleting an account is the one control in Settings that can't be undone,
// so it asks twice: once to open the panel, and once by making the learner
// type the word. The confirmation word is translated, but the string the
// server checks is always "DELETE" — a locale mismatch must never be the
// thing standing between someone and their own data.
//
// It lives at the bottom of the Account screen in a sheet of its own, a gap
// away from anything else — nothing sits beside it to be tapped by mistake,
// and the first Settings screen doesn't show it at all.
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
    <Sheet className="mt-[10px]">
      <ButtonRow
        title={t("deleteAccount")}
        desc={t("deleteDesc")}
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        danger
      />

      {open && (
        <div className="mx-[18px] mb-4 rounded-[12px] border border-danger/40 bg-danger-bg p-4">
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
    </Sheet>
  );
}
