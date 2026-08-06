"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlanKey } from "@/lib/plus";

export default function PlusCheckoutButton({
  plan,
  signedIn,
  highlight = false,
}: {
  plan: PlanKey;
  signedIn: boolean;
  highlight?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function checkout() {
    if (!signedIn) {
      router.push(`/auth/login?next=${encodeURIComponent("/pricing")}`);
      return;
    }
    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    }).catch(() => null);

    const data = await res?.json().catch(() => null);
    if (res?.ok && data?.url) {
      window.location.assign(data.url);
      return;
    }
    setBusy(false);
    setMessage(data?.error ?? "Couldn't start checkout. Try again in a moment.");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={checkout}
        disabled={busy}
        className={`w-full inline-flex items-center justify-center rounded-[10px] px-[22px] py-[11px] text-[14px] font-semibold transition-colors disabled:opacity-60 ${
          highlight
            ? "bg-[#16A34A] text-white hover:bg-[#15803D]"
            : "border border-[#E3DDD0] bg-white text-[#18181B] hover:bg-[#FAF7EF]"
        }`}
      >
        {busy ? "Opening checkout…" : signedIn ? "Get Plus" : "Log in to get Plus"}
      </button>
      {message && <span className="text-[12px] font-medium text-[#D97706]">{message}</span>}
    </div>
  );
}
