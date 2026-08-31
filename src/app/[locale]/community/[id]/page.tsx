import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Comments from "@/components/community/Comments";
import DeletePostButton from "@/components/community/DeletePostButton";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import {
  SAMPLE_POSTS,
  findNotice,
  isBoardKey,
  isTableMissing,
  splitPost,
  type CommunityComment,
} from "@/lib/community";
import { formatTimeAgo } from "@/components/community/time-ago";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("community");
  const tn = await getTranslations("nav");
  const locale = await getLocale();
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
      <div className="min-h-screen bg-warm text-charcoal">
        <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
          <Sidebar
            displayName={displayNameEarly}
            email={user.email ?? ""}
            streakDays={profile?.streak_days ?? 0}
            avatarUrl={profile?.avatar_url}
          />

          <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
            <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
              <Link href="/dashboard" className="hover:text-charcoal transition-colors">
                {tn("garden")}
              </Link>
              <span>/</span>
              <Link href="/community" className="hover:text-charcoal transition-colors">
                {t("title")}
              </Link>
              <span>/</span>
              <b className="text-charcoal font-semibold truncate max-w-[240px]">{notice.title}</b>
            </div>

            <article className="border border-success-line rounded-[14px] bg-cream max-w-[980px] px-[22px] py-5">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className="text-[11.5px] font-bold rounded-full border border-[var(--tint-green-line)] bg-success-bg text-success-deep px-2.5 py-[3px]">
                  {t("notice.officialBadge")}
                </span>
                <span className="text-[12.5px] text-muted">{t("notice.teamLine")}</span>
              </div>
              <h1 className="font-bold text-[20px] tracking-[-0.01em] mb-2.5">
                {notice.emoji} {notice.title}
              </h1>
              <p className="text-[14px] leading-[1.75] whitespace-pre-wrap break-words">{notice.body}</p>
            </article>

            <p className="text-[12.5px] text-faint mt-4 max-w-[980px]">
              {t("notice.closed")}{" "}
              <Link
                href="/community/new?board=question"
                className="font-semibold text-success hover:underline"
              >
                {t("notice.ask")}
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
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={displayName}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              {tn("garden")}
            </Link>
            <span>/</span>
            <Link href="/community" className="hover:text-charcoal transition-colors">
              {t("title")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold truncate max-w-[240px]">{title}</b>
          </div>

          <article className="border border-line rounded-[14px] bg-cream max-w-[980px] px-[22px] py-5">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span className="text-[11.5px] font-semibold rounded-full border border-[var(--tint-slate-line)] bg-[var(--tint-slate)] text-[var(--tint-slate-ink)] px-2.5 py-[3px]">
                {t(`boards.${isBoardKey(post.board) ? post.board : "free"}`)}
              </span>
              <span
                className={`text-[12.5px] ${
                  "author_plus" in post && post.author_plus
                    ? "font-semibold text-[#B45309]"
                    : "text-muted"
                }`}
              >
                {post.author_emoji ?? "🦊"} {post.author_name}
                {"author_plus" in post && post.author_plus && " 🌟"}
                {post.country ? ` · ${post.country}` : ""}
              </span>
              <span className="text-[12px] text-faint">
                {formatTimeAgo(post.created_at, (k, v) => t(`timeAgo.${k}`, v), locale)}
              </span>
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
