"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, type CommunityComment } from "@/lib/community";

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
      setError("Couldn't add your comment. Try again in a moment.");
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
      setError("Couldn't delete that comment.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="max-w-[980px] mt-5">
      <h2 className="font-semibold text-[15px] mb-2.5">
        Comments{comments.length > 0 && <span className="text-muted"> · {comments.length}</span>}
      </h2>

      {!available ? (
        <div className="border border-[#CBD5E1] rounded-[14px] bg-[#F1F5F9] px-[18px] py-3.5">
          <small className="text-[13px] text-muted">
            Comments open soon — run{" "}
            <code className="text-[12px]">supabase/migrations/0023_community_comments.sql</code> to
            turn them on.
          </small>
        </div>
      ) : (
        <>
          {comments.length === 0 && (
            <p className="text-[13px] text-faint mb-3">No comments yet — be the first.</p>
          )}
          {comments.length > 0 && (
            <div className="border border-line rounded-[14px] bg-white overflow-hidden mb-3">
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
                    <span className="text-[11.5px] text-faint">{timeAgo(c.created_at)}</span>
                    {c.mine && (
                      <button
                        type="button"
                        onClick={() => remove(c.id)}
                        disabled={deletingId === c.id}
                        className="ml-auto text-[11.5px] font-semibold text-[#C13E78] hover:underline disabled:opacity-40"
                      >
                        {deletingId === c.id ? "Deleting…" : "Delete"}
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

          <div className="border border-line rounded-[14px] bg-white p-3.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={`Reply as ${displayName}…`}
              className="w-full rounded-[10px] border border-line bg-warm px-3.5 py-2.5 text-[13.5px] leading-[1.55] outline-none transition-colors resize-y focus:border-[#334155] focus:bg-white"
            />
            <div className="flex items-center mt-2">
              <span className="text-[11.5px] text-faint">{draft.length}/1000</span>
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim() || busy}
                className="ml-auto rounded-[9px] px-4 py-1.5 text-[12.5px] font-semibold text-white bg-[#334155] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
              >
                {busy ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-[12.5px] text-[#C13E78] mt-2.5">{error}</p>}
    </section>
  );
}
