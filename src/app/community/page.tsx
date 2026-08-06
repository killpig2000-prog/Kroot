import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Composer from "@/components/community/Composer";
import PostList from "@/components/community/PostList";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { BOARDS, SAMPLE_POSTS, isBoardKey, type CommunityPost } from "@/lib/community";

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
    .select("id, user_id, author_name, author_emoji, country, board, content, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (board) query = query.eq("board", board);

  const { data: rows, error } = await query;

  // Only the "table hasn't been migrated yet" case gets the sample board; any
  // other failure shows a real notice rather than posts that don't exist.
  const tableMissing = error?.code === "42P01";
  const loadFailed = !!error && !tableMissing;
  // Strip user_id before it reaches the client — ownership becomes a boolean.
  const posts: CommunityPost[] = tableMissing
    ? SAMPLE_POSTS.filter((p) => !board || p.board === board)
    : (rows ?? []).map(({ user_id, ...post }) => ({
        ...post,
        mine: user_id === user.id,
      })) as CommunityPost[];
  const displayName = profile?.display_name ?? "there";

  const tab = (active: boolean) =>
    `rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
      active
        ? "bg-[#334155] border-[#334155] text-white"
        : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
    }`;

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
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Community</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F1F5F9] text-[#334155] border border-[#CBD5E1] items-center justify-center kr text-[15px] mr-[9px]">
                모
              </span>
              Community
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              Ask questions, share wins, find a practice partner
            </span>
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
              <small className="block text-[13px] text-[#6B6560] leading-[1.55]">
                Run the included migration{" "}
                <code className="text-[12px]">supabase/migrations/0012_community_posts.sql</code> to
                turn the board on. Until then, here&apos;s a peek at what it looks like.
              </small>
            </div>
          )}

          {loadFailed && (
            <div className="border border-[#E3DDD0] rounded-[14px] bg-[#FAF7EF] px-[18px] py-3.5 mb-5 max-w-[980px]">
              <small className="text-[13px] text-[#6B6560]">
                Couldn&apos;t load posts. Try refreshing in a moment.
              </small>
            </div>
          )}

          <Composer
            userId={user.id}
            displayName={displayName}
            defaultBoard={board ?? undefined}
            disabled={tableMissing}
          />
          <PostList posts={posts} readOnly={tableMissing} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
