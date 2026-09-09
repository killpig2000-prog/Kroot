"use client";

import { useEffect, type ReactNode } from "react";
import { useBackToClose } from "@/hooks/useBackToClose";

// The picker the Settings value-rows open (language, words a day): a sheet
// that slides up from the bottom on a phone and sits centred on a desktop.
// Picking closes it — there is no Save button anywhere in Settings, a choice
// takes effect the moment it's made.
//
// Back (the Android hardware button included) closes it instead of leaving
// the page, via useBackToClose — the same mechanism the word card's trace
// sheet uses.
export default function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const dismiss = useBackToClose(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="fixed inset-0 z-[60] bg-[#282319]/45 cursor-default"
      />
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="pointer-events-auto w-full sm:max-w-[420px] bg-sheet rounded-t-[22px] sm:rounded-[18px] border border-line shadow-[0_-12px_40px_-20px_rgba(40,35,25,.5)] pb-[max(12px,env(safe-area-inset-bottom))]"
          style={{ animation: "fadeUp .18s ease" }}
        >
          <div className="mx-auto mt-2.5 mb-1 h-1 w-9 rounded-full bg-line sm:hidden" aria-hidden="true" />
          <b className="block px-5 pt-2 pb-1 text-[15px] font-bold text-charcoal">{title}</b>
          <div className="px-2 pt-1">{children}</div>
        </div>
      </div>
    </>
  );
}

/** One choice in a sheet. The current one carries a check, nothing else does. */
export function SheetOption({
  label,
  sub,
  selected,
  onPick,
  disabled = false,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left transition-colors disabled:opacity-60 ${
        selected ? "bg-success-bg" : "hover:bg-warm-4"
      }`}
    >
      <span className="flex-1 min-w-0">
        <b className={`block text-[14.5px] font-bold ${selected ? "text-success-deep" : "text-charcoal"}`}>{label}</b>
        {sub ? <span className="block text-[12.5px] text-muted leading-snug">{sub}</span> : null}
      </span>
      <span
        className={`flex-none text-[15px] font-bold ${selected ? "text-success-deep" : "text-transparent"}`}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}
