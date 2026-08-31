"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function DeletePostButton({ postId }: { postId: string }) {
  const t = useTranslations("community.deletePost");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    if (!window.confirm(t("confirm"))) return;
    setBusy(true);
    setError(false);
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId);
      if (deleteError) {
        setError(true);
        return;
      }
      // replace, not push: back from /community would otherwise return to this
      // post's page, which no longer exists.
      router.replace("/community");
      router.refresh();
    } catch {
      // A throw here (offline, a blip) is the same story as a returned error.
      setError(true);
    } finally {
      // Never leave the button stuck saying "Deleting…" with no way back.
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-[9px] border border-line px-3 py-1.5 text-[12.5px] font-semibold text-[#C13E78] transition-colors hover:border-[#C13E78] disabled:opacity-40"
      >
        {busy ? t("deleting") : t("delete")}
      </button>
      {error && <small className="text-[12px] text-[#C13E78]">{t("failed")}</small>}
    </span>
  );
}
