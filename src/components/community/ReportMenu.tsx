"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { blockAuthor, reportContent, type ReportReason } from "./actions";

const REASONS: ReportReason[] = ["spam", "harassment", "sexual", "other"];

const ITEM =
  "w-full text-left min-h-[44px] px-3 rounded-[9px] font-semibold transition-colors hover:bg-warm disabled:opacity-40";

export default function ReportMenu({ kind, id }: { kind: "post" | "comment"; id: string }) {
  const t = useTranslations("community.moderation");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"menu" | "reasons" | "reported">("menu");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  function close() {
    setOpen(false);
    setView("menu");
    setFailed(false);
  }

  async function report(reason: ReportReason) {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      if (await reportContent(kind, id, reason)) setView("reported");
      else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  async function block() {
    if (busy || !window.confirm(t("blockConfirm"))) return;
    setBusy(true);
    setFailed(false);
    try {
      if (!(await blockAuthor(kind, id))) {
        setFailed(true);
        return;
      }
      close();
      if (kind === "post") router.replace("/community");
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={t("menu")}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className="w-11 h-11 -my-3 -mr-2.5 inline-flex items-center justify-center rounded-full text-[18px] leading-none text-faint transition-colors hover:bg-warm hover:text-charcoal"
      >
        ⋯
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            role="menu"
            className="absolute right-0 top-full mt-1 w-[230px] max-w-[calc(100vw-36px)] bg-cream border border-line rounded-[12px] shadow-lg z-50 p-1.5 text-[13.5px] text-charcoal"
          >
            {view === "menu" && (
              <>
                <button type="button" role="menuitem" onClick={() => setView("reasons")} className={ITEM}>
                  🚩 {t("report")}
                </button>
                <button type="button" role="menuitem" onClick={block} disabled={busy} className={`${ITEM} text-danger`}>
                  🚫 {t("block")}
                </button>
              </>
            )}
            {view === "reasons" && (
              <>
                <p className="px-3 pt-1.5 pb-1 text-[12px] text-faint">{t("why")}</p>
                {REASONS.map((r) => (
                  <button key={r} type="button" role="menuitem" onClick={() => report(r)} disabled={busy} className={ITEM}>
                    {t(`reasons.${r}`)}
                  </button>
                ))}
              </>
            )}
            {view === "reported" && <p className="px-3 py-3 text-muted">{t("reported")}</p>}
            {failed && <p className="px-3 pb-2 text-[12px] text-danger">{t("failed")}</p>}
          </div>
        </>
      )}
    </div>
  );
}
