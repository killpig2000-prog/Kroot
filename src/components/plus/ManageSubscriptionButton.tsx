"use client";

import { useState } from "react";

// Sends the subscriber to the Stripe Billing Portal (cancel, change card,
// invoices). Rendered only for users with an active or past subscription.
export default function ManageSubscriptionButton({ className }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className={
          className ??
          "rounded-[9px] border border-line bg-white px-4 py-2 text-[13px] font-semibold text-charcoal hover:bg-warm transition-colors disabled:opacity-60"
        }
      >
        {busy ? "Opening…" : "Manage subscription"}
      </button>
      {error && (
        <small className="text-[12px] text-[#DB2777]">
          Couldn&apos;t open billing — try again in a moment.
        </small>
      )}
    </span>
  );
}
