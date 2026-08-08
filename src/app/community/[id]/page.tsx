import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Comments from "@/components/community/Comments";
import DeletePostButton from "@/components/community/DeletePostButton";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import {
  SAMPLE_POSTS,
  boardLabel,
  findNotice,
  isTableMissing,
  splitPost,
  timeAgo,
  type CommunityComment,
} from "@/lib/community";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { id } = await params;
  const displayNameEarly = profile?.display_name ?? "there";

  // Official pinned notices live in code, not the DB — no comments, no delete.
  const notice = findNotice(id);
  if (notice) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
        <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
          <Sidebar
            displayName={displayNameEarly}
            email={user.email ?? ""}
            streakDays={profile?.streak_days ?? 0}
            avatarUrl={profile?.avatar_url}
          />

          <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
            <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
              <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
                Garden
              </Link>
              <span>/</span>
              <Link href="/community" className="hover:text-[#18181B] transition-colors">
                Community
              </Link>
              <span>/</span>
              <b className="text-[#18181B] font-semibold truncate max-w-[240px]">{notice.title}</b>
            </div>

            <article className="border border-[#BBF7D0] rounded-[14px] bg-white max-w-[980px] px-[22px] py-5">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-[11.5px] font-bold rounded-full border border-[#86EFAC] bg-[#F0FDF4] text-[#15803D] px-2.5 py-[3px]">
                  📌 Official notice
                </span>
                <span className="text-[12.5px] text-[#6B6560]">🌱 Kroot team</span>
              </div>
              <h1 className="font-bold text-[20px] tracking-[-0.01em] mb-2.5">
                {notice.emoji} {notice.title}
              </h1>
              <p className="text-[14px] leading-[1.75] whitespace-pre-wrap break-words">{notice.body}</p>
            </article>

            <p className="text-[12.5px] text-[#A19A8C] mt-4 max-w-[980px]">
              Comments are closed on notices — got a question about this?{" "}
              <Link
                href="/community/new?board=question"
                className="font-semibold text-[#16A34A] hover:underline"
              >
                Ask it on the Question board →
              </Link>
            </p>
          </main>
        </div>

        <BottomNav />
      </div>
    );
  }

  const { data: row, error } = await supabase
    .from("community_posts")
    .select("id, user_id, author_name, author_emoji, author_plus, country, board, content, created_at")
    .eq("id", id)
    .maybeSingle();

  const tableMissing = isTableMissing(error);
  const post = tableMissing ? SAMPLE_POSTS.find((p) => p.id === id) ?? null : row;
  if (!post) notFound();
  const mine = !tableMissing && "user_id" in post && post.user_id === user.id;

  let comments: CommunityComment[] = [];
  let commentsAvailable = !tableMissing;
  if (commentsAvailable) {
    const { data: commentRows, error: commentsError } = await supabase
      .from("community_comments")
      .select("id, user_id, author_name, author_emoji, author_plus, content, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .limit(200);
    if (isTableMissing(commentsError)) {
      commentsAvailable = false;
    } else {
      comments = (commentRows ?? []).map(({ user_id, ...c }) => ({
        ...c,
        mine: user_id === user.id,
      }));
    }
  }

  const { title, body } = splitPost(post.content);
  const displayName = profile?.display_name ?? "there";

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <Link href="/community" className="hover:text-[#18181B] transition-colors">
              Community
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold truncate max-w-[240px]">{title}</b>
          </div>

          <article className="border border-[#E3DDD0] rounded-[14px] bg-white max-w-[980px] px-[22px] py-5">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="text-[11.5px] font-semibold rounded-full border border-[#CBD5E1] bg-[#F1F5F9] text-[#334155] px-2.5 py-[3px]">
                {boardLabel(post.board)}
              </span>
              <span
                className={`text-[12.5px] ${
                  "author_plus" in post && post.author_plus
                    ? "font-semibold text-[#B45309]"
                    : "text-[#6B6560]"
                }`}
              >
                {post.author_emoji ?? "🦊"} {post.author_name}
                {"author_plus" in post && post.author_plus && " 🌟"}
                {post.country ? ` · ${post.country}` : ""}
              </span>
              <span className="text-[12px] text-[#A19A8C]">{timeAgo(post.created_at)}</span>
              {mine && (
                <span className="ml-auto">
                  <DeletePostButton postId={post.id} />
                </span>
              )}
            </div>
            <h1 className="font-bold text-[20px] tracking-[-0.01em] mb-2.5">{title}</h1>
            {body && (
              <p className="text-[14px] leading-[1.7] whitespace-pre-wrap break-words">{body}</p>
            )}
          </article>

          <Comments
            postId={post.id}
            userId={user.id}
            displayName={displayName}
            comments={comments}
            available={commentsAvailable}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
