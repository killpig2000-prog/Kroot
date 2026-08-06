"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BOARDS, type BoardKey } from "@/lib/community";

export default function Composer({
  userId,
  displayName,
  defaultBoard,
  disabled = false,
}: {
  userId: string;
  displayName: string;
  defaultBoard?: BoardKey;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [board, setBoard] = useState<BoardKey>(defaultBoard ?? "free");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = content.trim().length > 0 && !busy && !disabled;

  async function post() {
    if (!canPost) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("community_posts").insert({
      user_id: userId,
      author_name: displayName,
      author_emoji: "🦊",
      board,
      content: content.trim(),
    });

    setBusy(false);
    if (insertError) {
      setError("Couldn't post just yet — the community table may not be set up.");
      return;
    }
    setContent("");
    router.refresh();
  }

  return (
    <div className="border border-[#E3DDD0] rounded-[14px] bg-white p-[18px] mb-5 max-w-[980px]">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-[9px] bg-[#FAF7EF] border border-[#E3DDD0] flex items-center justify-center text-sm">
          🦊
        </span>
        <b className="text-[13.5px] font-semibold">{displayName}</b>
        <span className="text-[12.5px] text-[#A19A8C]">— say something to the garden</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={600}
        disabled={disabled}
        placeholder="First line is the title — then write the rest below it."
        className="w-full rounded-[10px] border border-[#E3DDD0] bg-[#FAF7EF] px-3.5 py-3 text-[14px] leading-[1.55] outline-none transition-colors resize-y focus:border-[#334155] focus:bg-white disabled:opacity-60"
      />

      <div className="flex items-center gap-2.5 mt-3 flex-wrap">
        <select
          value={board}
          onChange={(e) => setBoard(e.target.value as BoardKey)}
          disabled={disabled}
          className="rounded-[9px] border border-[#E3DDD0] bg-white px-3 py-2 text-[13.5px] font-semibold text-[#6B6560] outline-none focus:border-[#334155] disabled:opacity-60"
        >
          {BOARDS.map((b) => (
            <option key={b.key} value={b.key}>
              {b.emoji} {b.label}
            </option>
          ))}
        </select>

        <span className="text-[12px] text-[#A19A8C]">{content.length}/600</span>

        <button
          type="button"
          onClick={post}
          disabled={!canPost}
          className="ml-auto rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold text-white bg-[#334155] border border-[#334155] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>

      {error && <p className="text-[12.5px] text-[#DB2777] mt-2.5">{error}</p>}
    </div>
  );
}
