import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import PostList from "@/components/community/PostList";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import {
  BOARDS,
  NOTICES,
  SAMPLE_POSTS,
  isBoardKey,
  isTableMissing,
  type CommunityPost,
} from "@/lib/community";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const sp = await searchParams;
  const board = isBoardKey(sp.board) ? sp.board : null;

  let query = supabase
    .from("community_posts")
    .select("id, user_id, author_name, author_emoji, author_plus, country, board, content, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (board) query = query.eq("board", board);

  const { data: rows, error } = await query;

  // Only the "table hasn't been migrated yet" case gets the sample board; any
  // other failure shows a real notice rather than posts that don't exist.
  const tableMissing = isTableMissing(error);
  const loadFailed = !!error && !tableMissing;
  // Strip user_id before it reaches the client — ownership becomes a boolean.
  const posts: CommunityPost[] = tableMissing
    ? SAMPLE_POSTS.filter((p) => !board || p.board === board)
    : (rows ?? []).map(({ user_id, ...post }) => ({
        ...post,
        mine: user_id === user.id,
      })) as CommunityPost[];
  const displayName = profile?.display_name ?? "there";

  // Best-effort comment counts for the list; missing table just means zeros.
  const commentCounts: Record<string, number> = {};
  if (!tableMissing && posts.length > 0) {
    const { data: commentRows } = await supabase
      .from("community_comments")
      .select("post_id")
      .in("post_id", posts.map((p) => p.id));
    for (const row of commentRows ?? []) {
      commentCounts[row.post_id] = (commentCounts[row.post_id] ?? 0) + 1;
    }
  }

  const tab = (active: boolean) =>
    `rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
      active
        ? "bg-[#334155] border-[#334155] text-white"
        : "bg-white border-line text-muted hover:border-faint"
    }`;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Community</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] items-center justify-center kr text-[15px] mr-[9px]">
                모
              </span>
              Community
            </h1>
            <Link
              href="/community/new"
              className="rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold text-white bg-[#334155] border border-[#334155] transition-all hover:-translate-y-0.5"
            >
              ✍️ New post
            </Link>
          </div>

          {/* board tabs */}
          <div className="flex gap-2 mb-5 flex-wrap">
            <Link href="/community" className={tab(!board)}>
              All
            </Link>
            {BOARDS.map((b) => (
              <Link
                key={b.key}
                href={`/community?board=${b.key}`}
                className={tab(board === b.key)}
              >
                {b.emoji} {b.label}
              </Link>
            ))}
          </div>

          {tableMissing && (
            <div className="border border-[#CBD5E1] rounded-[14px] bg-[#F1F5F9] p-[18px] mb-5 max-w-[980px]">
              <b className="block font-semibold text-[14px] mb-1">Community opens soon</b>
              <small className="block text-[13px] text-muted leading-[1.55]">
                Run the included migration{" "}
                <code className="text-[12px]">supabase/migrations/0012_community_posts.sql</code> to
                turn the board on. Until then, here&apos;s a peek at what it looks like.
              </small>
            </div>
          )}

          {loadFailed && (
            <div className="border border-line rounded-[14px] bg-warm px-[18px] py-3.5 mb-5 max-w-[980px]">
              <small className="text-[13px] text-muted">
                Couldn&apos;t load posts. Try refreshing in a moment.
              </small>
            </div>
          )}

          {/* pinned official notices — defined in code, shown on every board */}
          <div className="border border-success-line rounded-[14px] bg-success-bg max-w-[980px] overflow-hidden mb-3.5">
            {NOTICES.map((n, i) => (
              <Link
                key={n.id}
                href={`/community/${n.id}`}
                className={`px-[18px] py-[11px] flex items-center gap-3 transition-colors hover:bg-[#DCFCE7] ${
                  i > 0 ? "border-t border-success-line" : ""
                }`}
              >
                <span className="text-[11.5px] font-bold rounded-full border border-[#86EFAC] bg-white text-success-deep px-2.5 py-[3px] flex-none">
                  📌 Notice
                </span>
                <b className="min-w-0 flex-1 font-semibold text-[14px] truncate">
                  {n.emoji} {n.title}
                </b>
                <span className="text-[12.5px] text-success-deep font-semibold flex-none hidden sm:inline">
                  Kroot team
                </span>
              </Link>
            ))}
          </div>

          <PostList posts={posts} commentCounts={commentCounts} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
