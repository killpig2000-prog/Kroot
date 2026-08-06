"use client";

import { useMemo, useState } from "react";
import { BOARDS, boardLabel, timeAgo, type BoardKey, type CommunityPost } from "@/lib/community";

export default function PostFeed({ posts }: { posts: CommunityPost[] }) {
  const [board, setBoard] = useState<BoardKey | "all">("all");

  const shown = useMemo(
    () => (board === "all" ? posts : posts.filter((p) => p.board === board)),
    [posts, board]
  );

  const tab = (active: boolean) =>
    `rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
      active
        ? "bg-[#334155] border-[#334155] text-white"
        : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
    }`;

  return (
    <>
      <div className="flex gap-2 mb-5 flex-wrap">
        <button type="button" onClick={() => setBoard("all")} className={tab(board === "all")}>
          All {posts.length}
        </button>
        {BOARDS.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => setBoard(b.key)}
            className={tab(board === b.key)}
          >
            {b.emoji} {b.label} {posts.filter((p) => p.board === b.key).length}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="border border-[#E3DDD0] rounded-[14px] bg-[#FAF7EF] p-8 text-center max-w-[980px]">
          <span className="text-[26px] block mb-2">🌱</span>
          <b className="block font-semibold text-[15px] mb-1">Nothing here yet</b>
          <small className="text-[13px] text-[#6B6560]">
            Be the first to post on this board.
          </small>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3.5 max-w-[980px] items-start">
          {shown.map((p) => (
            <div
              key={p.id}
              style={{ animation: "fadeUp .3s ease" }}
              className="border border-[#E3DDD0] rounded-[14px] bg-white p-[18px] transition-all duration-150 hover:border-[#334155] hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="w-8 h-8 rounded-[9px] bg-[#FAF7EF] border border-[#E3DDD0] flex items-center justify-center text-sm shrink-0">
                  {p.author_emoji ?? "🦊"}
                </span>
                <div className="min-w-0">
                  <b className="text-[13.5px] font-semibold block leading-[1.25] truncate">
                    {p.author_name}
                    {p.country ? ` · ${p.country}` : ""}
                  </b>
                  <span className="text-[11.5px] text-[#A19A8C]">
                    {boardLabel(p.board)} · {timeAgo(p.created_at)}
                  </span>
                </div>
              </div>
              <p className="text-[13.5px] leading-[1.6] whitespace-pre-wrap break-words">
                {p.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
