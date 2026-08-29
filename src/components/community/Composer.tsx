"use client";

import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BOARDS, type BoardKey } from "@/lib/community";

// Full new-post form for /community/new. The first line of `content` is the
// title by convention, so the separate title field is joined in on submit.
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
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [board, setBoard] = useState<BoardKey>(defaultBoard ?? "free");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = title.trim().length > 0 && !busy && !disabled;

  async function post() {
    if (!canPost) return;
    setBusy(true);
    setError(null);

    const content = [title.trim().replace(/\n/g, " "), body.trim()].filter(Boolean).join("\n");
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("community_posts")
      .insert({
        user_id: userId,
        author_name: displayName,
        author_emoji: "🦊",
        board,
        content,
      })
      .select("id")
      .single();

    setBusy(false);
    if (insertError || !data) {
      setError("Couldn't post just yet — the community table may not be set up.");
      return;
    }
    router.push(`/community/${data.id}`);
    router.refresh();
  }

  return (
    <div className="border border-line rounded-[14px] bg-cream p-[18px] max-w-[980px]">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-8 h-8 rounded-[9px] bg-warm border border-line flex items-center justify-center text-sm">
          🦊
        </span>
        <b className="text-[13.5px] font-semibold">{displayName}</b>
        <span className="text-[12.5px] text-faint">— say something to the garden</span>
      </div>

      <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
        <select
          value={board}
          onChange={(e) => setBoard(e.target.value as BoardKey)}
          disabled={disabled}
          className="rounded-[9px] border border-line bg-cream px-3 py-2 text-[13.5px] font-semibold text-muted outline-none focus:border-[var(--tint-slate-line)] disabled:opacity-60"
        >
          {BOARDS.map((b) => (
            <option key={b.key} value={b.key}>
              {b.emoji} {b.label}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          disabled={disabled}
          placeholder="Title"
          className="flex-1 min-w-[200px] rounded-[10px] border border-line bg-warm px-3.5 py-2.5 text-[14px] font-semibold outline-none transition-colors focus:border-[var(--tint-slate-line)] focus:bg-cream disabled:opacity-60"
        />
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        maxLength={2000}
        disabled={disabled}
        placeholder="Write your post…"
        className="w-full rounded-[10px] border border-line bg-warm px-3.5 py-3 text-[14px] leading-[1.55] outline-none transition-colors resize-y focus:border-[var(--tint-slate-line)] focus:bg-cream disabled:opacity-60"
      />

      <div className="flex items-center gap-2.5 mt-3 flex-wrap">
        <span className="text-[12px] text-faint">{body.length}/2000</span>
        <button
          type="button"
          onClick={post}
          disabled={!canPost}
          className="ml-auto rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold text-white bg-[#334155] border border-[var(--tint-slate-line)] transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>

      {error && <p className="text-[12.5px] text-[#C13E78] mt-2.5">{error}</p>}
    </div>
  );
}
