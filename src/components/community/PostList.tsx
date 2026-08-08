import Link from "next/link";
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
      <div className="border border-[#E3DDD0] rounded-[14px] bg-[#FAF7EF] p-8 text-center max-w-[980px]">
        <span className="text-[26px] block mb-2">🌱</span>
        <b className="block font-semibold text-[15px] mb-1">Nothing here yet</b>
        <small className="text-[13px] text-[#6B6560]">Be the first to post on this board.</small>
      </div>
    );
  }

  return (
    <div className="border border-[#E3DDD0] rounded-[14px] bg-white max-w-[980px] overflow-hidden">
      {posts.map((p, i) => {
        const { title } = splitPost(p.content);
        const count = commentCounts[p.id] ?? 0;

        return (
          <Link
            key={p.id}
            href={`/community/${p.id}`}
            className={`px-[18px] py-3 flex items-center gap-3 transition-colors hover:bg-[#FAF7EF] ${
              i > 0 ? "border-t border-[#E3DDD0]" : ""
            }`}
          >
            <span className="text-[11.5px] font-semibold rounded-full border border-[#CBD5E1] bg-[#F1F5F9] text-[#334155] px-2.5 py-[3px] flex-none">
              {boardLabel(p.board)}
            </span>
            <b className="min-w-0 flex-1 font-semibold text-[14px] truncate">
              {title}
              {count > 0 && <span className="ml-1.5 text-[12px] font-bold text-[#334155]">[{count}]</span>}
            </b>
            <span
              className={`text-[12.5px] flex-none hidden sm:inline truncate max-w-[140px] ${
                p.author_plus ? "font-semibold text-[#B45309]" : "text-[#6B6560]"
              }`}
            >
              {p.author_emoji ?? "🦊"} {p.author_name}
              {p.author_plus && " 🌟"}
            </span>
            <span className="text-[12px] text-[#A19A8C] flex-none w-[64px] text-right">
              {timeAgo(p.created_at)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
