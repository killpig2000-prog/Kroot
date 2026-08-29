"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Link, redirect, useRouter, usePathname, getPathname } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

// Removes one word from the learner's deck (My words page).
export default function ForgetWordButton({ userId, wordKey }: { userId: string; wordKey: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function forget() {
    if (busy) return;
    setBusy(true);
    const { error } = await supabase
      .from("vocabulary_progress")
      .delete()
      .eq("user_id", userId)
      .eq("word_key", wordKey);
    if (error) console.error("forget word failed:", error.message);
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={() => void forget()}
      disabled={busy}
      className="flex-none text-[11.5px] font-semibold text-faint hover:text-danger transition-colors disabled:opacity-50"
    >
      {busy ? "…" : "Forget"}
    </button>
  );
}
