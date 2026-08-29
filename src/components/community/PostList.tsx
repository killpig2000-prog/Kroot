import { Link } from "@/i18n/navigation";
import { boardLabel, splitPost, timeAgo, type CommunityPost } from "@/lib/community";

export default function PostList({
  posts,
  commentCounts = {},
}: {
  posts: CommunityPost[];
  commentCounts?: Record<string, number>;
}) {
  if (posts.length === 0) {
    return (
      <div className="border border-line rounded-[14px] bg-warm p-8 text-center max-w-[980px]">
        <span className="text-[26px] block mb-2">🌱</span>
        <b className="block font-semibold text-[15px] mb-1">Nothing here yet</b>
        <small className="text-[13px] text-muted">Be the first to post on this board.</small>
      </div>
    );
  }

  return (
    <div className="border border-line rounded-[14px] bg-cream max-w-[980px] overflow-hidden">
      {posts.map((p, i) => {
        const { title } = splitPost(p.content);
        const count = commentCounts[p.id] ?? 0;

        return (
          <Link
            key={p.id}
            href={`/community/${p.id}`}
            className={`px-[18px] py-3 flex items-center gap-3 transition-colors hover:bg-warm ${
              i > 0 ? "border-t border-line" : ""
            }`}
          >
            <span className="text-[11.5px] font-semibold rounded-full border border-[var(--tint-slate-line)] bg-[var(--tint-slate)] text-[var(--tint-slate-ink)] px-2.5 py-[3px] flex-none">
              {boardLabel(p.board)}
            </span>
            <b className="min-w-0 flex-1 font-semibold text-[14px] truncate">
              {title}
              {count > 0 && <span className="ml-1.5 text-[12px] font-bold text-[var(--tint-slate-ink)]">[{count}]</span>}
            </b>
            <span
              className={`text-[12.5px] flex-none hidden sm:inline truncate max-w-[140px] ${
                p.author_plus ? "font-semibold text-[#B45309]" : "text-muted"
              }`}
            >
              {p.author_emoji ?? "🦊"} {p.author_name}
              {p.author_plus && " 🌟"}
            </span>
            <span className="text-[12px] text-faint flex-none w-[64px] text-right">
              {timeAgo(p.created_at)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
