"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { boardLabel, timeAgo, type CommunityPost } from "@/lib/community";

// A post has no title column, so the first line doubles as one and the rest is
// the body revealed on expand.
function splitPost(content: string): { title: string; body: string } {
  const newline = content.indexOf("\n");
  if (newline === -1) return { title: content, body: "" };
  return { title: content.slice(0, newline), body: content.slice(newline + 1).trim() };
}

export default function PostList({
  posts,
  currentUserId,
  readOnly = false,
}: {
  posts: CommunityPost[];
  currentUserId: string;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setDeletingId(id);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("community_posts").delete().eq("id", id);

    setDeletingId(null);
    if (deleteError) {
      setError("Couldn't delete that post.");
      return;
    }
    setOpenId(null);
    router.refresh();
  }

  if (posts.length === 0) {
    return (
      <div className="border border-[#E7E5E4] rounded-[14px] bg-[#FAFAF9] p-8 text-center max-w-[980px]">
        <span className="text-[26px] block mb-2">🌱</span>
        <b className="block font-semibold text-[15px] mb-1">Nothing here yet</b>
        <small className="text-[13px] text-[#71717A]">Be the first to post on this board.</small>
      </div>
    );
  }

  return (
    <>
      {error && <p className="text-[12.5px] text-[#DB2777] mb-2.5">{error}</p>}

      <div className="border border-[#E7E5E4] rounded-[14px] bg-white max-w-[980px] overflow-hidden">
        {posts.map((p, i) => {
          const { title, body } = splitPost(p.content);
          const open = openId === p.id;
          const mine = !readOnly && p.user_id === currentUserId;

          return (
            <div key={p.id} className={i > 0 ? "border-t border-[#E7E5E4]" : ""}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : p.id)}
                aria-expanded={open}
                className={`w-full text-left px-[18px] py-3 flex items-center gap-3 transition-colors ${
                  open ? "bg-[#F8FAFC]" : "hover:bg-[#FAFAF9]"
                }`}
              >
                <span className="text-[11.5px] font-semibold rounded-full border border-[#CBD5E1] bg-[#F1F5F9] text-[#334155] px-2.5 py-[3px] flex-none">
                  {boardLabel(p.board)}
                </span>
                <b className="min-w-0 flex-1 font-semibold text-[14px] truncate">{title}</b>
                <span className="text-[12.5px] text-[#71717A] flex-none hidden sm:inline truncate max-w-[140px]">
                  {p.author_name}
                </span>
                <span className="text-[12px] text-[#A1A1AA] flex-none w-[64px] text-right">
                  {timeAgo(p.created_at)}
                </span>
              </button>

              {open && (
                <div className="px-[18px] pb-4 pt-1 bg-[#F8FAFC]">
                  <p className="text-[13.5px] leading-[1.65] whitespace-pre-wrap break-words">
                    {body || title}
                  </p>
                  <div className="flex items-center gap-2.5 mt-3">
                    <span className="text-[12px] text-[#A1A1AA]">
                      {p.author_emoji ?? "🦊"} {p.author_name}
                      {p.country ? ` · ${p.country}` : ""}
                    </span>
                    {mine && (
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        disabled={deletingId === p.id}
                        className="ml-auto rounded-[9px] border border-[#E7E5E4] px-3 py-1.5 text-[12.5px] font-semibold text-[#DB2777] transition-colors hover:border-[#DB2777] disabled:opacity-40"
                      >
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
