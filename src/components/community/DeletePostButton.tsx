"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setBusy(true);
    setError(false);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("community_posts").delete().eq("id", postId);
    setBusy(false);
    if (deleteError) {
      setError(true);
      return;
    }
    router.push("/community");
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-[9px] border border-line px-3 py-1.5 text-[12.5px] font-semibold text-[#C13E78] transition-colors hover:border-[#C13E78] disabled:opacity-40"
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
      {error && <small className="text-[12px] text-[#C13E78]">Couldn&apos;t delete.</small>}
    </span>
  );
}
