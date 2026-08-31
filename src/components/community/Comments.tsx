"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { type CommunityComment } from "@/lib/community";
import { formatTimeAgo } from "./time-ago";

export default function Comments({
  postId,
  userId,
  displayName,
  comments,
  available,
}: {
  postId: string;
  userId: string;
  displayName: string;
  comments: CommunityComment[];
  /** False when the comments table hasn't been migrated yet. */
  available: boolean;
}) {
  const t = useTranslations("community.comments");
  const tt = useTranslations("community.timeAgo");
  const locale = useLocale();
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const content = draft.trim();
    if (!content || busy) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("community_comments").insert({
      post_id: postId,
      user_id: userId,
      author_name: displayName,
      author_emoji: "🦊",
      content,
    });

    setBusy(false);
    if (insertError) {
      setError(t("errAdd"));
      return;
    }
    setDraft("");
    router.refresh();
  }

  async function remove(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("community_comments").delete().eq("id", id);
    setDeletingId(null);
    if (deleteError) {
      setError(t("errDelete"));
      return;
    }
    router.refresh();
  }

  return (
    <section className="max-w-[980px] mt-5">
      <h2 className="font-semibold text-[15px] mb-2.5">
        {t("heading")}
        {comments.length > 0 && (
          <span className="text-muted"> {t("count", { n: comments.length })}</span>
        )}
      </h2>

      {!available ? (
        <div className="border border-[var(--tint-slate-line)] rounded-[14px] bg-[var(--tint-slate)] px-[18px] py-3.5">
          <small className="text-[13px] text-muted">
            {t.rich("unavailable", {
              file: "supabase/migrations/0023_community_comments.sql",
              code: (chunks) => <code className="text-[12px]">{chunks}</code>,
            })}
          </small>
        </div>
      ) : (
        <>
          {comments.length === 0 && (
            <p className="text-[13px] text-faint mb-3">{t("none")}</p>
          )}
          {comments.length > 0 && (
            <div className="border border-line rounded-[14px] bg-cream overflow-hidden mb-3">
              {comments.map((c, i) => (
                <div
                  key={c.id}
                  className={`px-[18px] py-3 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[12.5px] font-semibold ${c.author_plus ? "text-[#B45309]" : ""}`}
                    >
                      {c.author_emoji ?? "🦊"} {c.author_name}
                      {c.author_plus && " 🌟"}
                    </span>
                    <span className="text-[11.5px] text-faint">{formatTimeAgo(c.created_at, (k, v) => tt(k, v), locale)}</span>
                    {c.mine && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        disabled={deletingId === c.id}
                        className="ml-auto text-[11.5px] font-semibold text-[#C13E78] hover:underline disabled:opacity-40"
                      >
                        {deletingId === c.id ? t("deleting") : t("delete")}
                      </button>
                    )}
                  </div>
                  <p className="text-[13.5px] leading-[1.6] whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border border-line rounded-[14px] bg-cream p-3.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={t("placeholder", { name: displayName })}
              className="w-full rounded-[10px] border border-line bg-warm px-3.5 py-2.5 text-[13.5px] leading-[1.55] outline-none transition-colors resize-y focus:border-[var(--tint-slate-line)] focus:bg-cream"
            />
            <div className="flex items-center mt-2">
              <span className="text-[11.5px] text-faint">{t("counter", { n: draft.length, max: 1000 })}</span>
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim() || busy}
                className="ml-auto rounded-[9px] px-4 py-1.5 text-[12.5px] font-semibold text-white bg-[#334155] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
              >
                {busy ? t("posting") : t("submit")}
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-[12.5px] text-[#C13E78] mt-2.5">{error}</p>}
    </section>
  );
}
