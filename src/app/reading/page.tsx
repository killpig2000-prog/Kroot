import Link from "next/link";
import LevelTabs from "@/components/ui/LevelTabs";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ChapterPathGroup from "@/components/chapters/ChapterPathGroup";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { getChapterStatuses, getChaptersForLevel } from "@/lib/reading";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";

// Genre keys are unique across all levels (diary/story repeat at every level;
// the other two slots change per level to match real-world text types that
// get harder as CEFR level rises — see [[chapter-list-garden-path]] memory).
const GENRE_META: Record<string, { icon: string; label: string; blurb: string }> = {
  diary: { icon: "📔", label: "Diary", blurb: "Everyday life, told as it happens" },
  story: { icon: "🎈", label: "Story", blurb: "Something specific happens — a small event" },
  notice: { icon: "📌", label: "Notices", blurb: "Real signs and postings you'd see around town" },
  dialogue: { icon: "💬", label: "Dialogue", blurb: "Two people talking — practice following a conversation" },
  message: { icon: "📱", label: "Messages", blurb: "A text chat between two people" },
  instruction: { icon: "📋", label: "Instructions", blurb: "Step-by-step — a recipe, a how-to, a set of directions" },
  email: { icon: "✉️", label: "Emails", blurb: "Real correspondence — work, landlords, RSVPs" },
  explainer: { icon: "📚", label: "Explainers", blurb: "How something works, or a Korean custom explained" },
  review: { icon: "⭐", label: "Reviews", blurb: "An opinion piece — what's good, what's not, the verdict" },
  article: { icon: "📰", label: "Articles", blurb: "A short news piece on a social trend" },
  opinion: { icon: "🗣️", label: "Opinion", blurb: "A writer argues a stance, and weighs the other side" },
  editorial: { icon: "🏛️", label: "Editorials", blurb: "A newspaper opinion column on a policy or social issue" },
  essay: { icon: "🖋️", label: "Essays", blurb: "A reflective piece on identity, work, or modern life" },
  academic: { icon: "🎓", label: "Academic", blurb: "A scholarly explainer on history, language, or ideas" },
  interview: { icon: "🎙️", label: "Interviews", blurb: "A Q&A with an expert, writer, or public figure" },
};

const STATUS_STYLE: Record<string, { badge: string; seed: string; icon: string }> = {
  done: {
    badge: "text-success bg-success-bg border-success-line",
    seed: "bg-success-bg text-success border-success-line",
    icon: "✅",
  },
  current: {
    badge: "text-sky-deep bg-[#EFF6FF] border-sky-line",
    seed: "bg-[#EFF6FF] text-sky-deep border-sky-line",
    icon: "📖",
  },
  locked: {
    badge: "text-faint bg-warm border-line",
    seed: "bg-warm text-faint border-line",
    icon: "🔒",
  },
};

export default async function ReadingMapPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [profile, { data: progress }, sp] = await Promise.all([
    getDashboardProfile(supabase, user.id),
    supabase
      .from("reading_progress")
      .select("passage_key")
      .eq("user_id", user.id)
      .not("last_reviewed_at", "is", null),
    searchParams,
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;
  const chapters = getChaptersForLevel(level);

  const completedKeys = new Set((progress ?? []).map((p) => p.passage_key));
  const statuses = getChapterStatuses(chapters, completedKeys);
  const doneCount = statuses.filter((s) => s === "done").length;

  // 160 flat chapter rows is an endless scroll — group into one collapsible
  // set per genre (a run of consecutive chapters sharing a genre), with the
  // set containing the current chapter open. Inside, a divider every ten.
  const DIVIDER_EVERY = 10;
  const groups: { chapter: (typeof chapters)[number]; status: string; index: number }[][] = [];
  chapters.forEach((chapter, i) => {
    const entry = { chapter, status: statuses[i], index: i };
    const last = groups[groups.length - 1];
    if (last && last[0].chapter[0].genre === chapter[0].genre) last.push(entry);
    else groups.push([entry]);
  });
  const continueIndex = statuses.findIndex((s) => s === "current");
  const openGroupIndex =
    continueIndex >= 0 ? groups.findIndex((g) => g.some((e) => e.index === continueIndex)) : -1;
  const continueChapter = continueIndex >= 0 ? chapters[continueIndex][0] : null;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
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
            <b className="text-charcoal font-semibold">Reading</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#EFF6FF] text-sky-deep border border-sky-line items-center justify-center kr text-[15px] mr-[9px]">
                읽
              </span>
              Reading
              <span className="ml-2.5 text-[12.5px] font-semibold text-sky-deep bg-[#EFF6FF] border border-sky-line rounded-full px-2.5 py-[2px] tracking-normal">
                Story Grove
              </span>
            </h1>
            <span className="text-[13px] text-muted">
              Level {level} · <b className="text-sky-deep">{doneCount}</b> of {chapters.length} chapters read
            </span>
          </div>

          <p className="text-[13px] text-muted mb-6">
            Read the story, then answer the questions — finishing chapters keeps the next few open.
          </p>

          <LevelTabs
            className="mb-6"
            levels={LEVEL_ORDER}
            current={level}
            mine={myLevel}
            unlocked={(lv) => isDifficultyUnlocked(lv, myLevel)}
            href={(lv) => `/reading?level=${lv}`}
            accent="bg-sky-deep border-sky-deep text-white"
          />

          {/* continue card: one obvious next step above the chapter groups */}
          {continueChapter && (
            <Link
              href={`/reading/session?chapter=${continueIndex}&level=${level}`}
              className="flex items-center gap-3.5 border-[1.5px] border-sky-line bg-[#EFF6FF] rounded-[14px] px-5 py-4 mb-6 max-w-[720px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-sky-line flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                📖
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#1D4ED8]">
                  Continue · Chapter {continueIndex + 1}
                </b>
                <span className="text-[13px] text-[#3B82F6] truncate block">{continueChapter.title_en}</span>
              </span>
              <span className="text-[13px] font-semibold text-sky-deep transition-transform group-hover:translate-x-0.5">
                Start →
              </span>
            </Link>
          )}

          <div className="grid gap-3 max-w-[720px]">
            {groups.map((group, gi) => {
              const first = group[0].index + 1;
              const last = group[group.length - 1].index + 1;
              const groupDone = group.filter((g) => g.status === "done").length;
              const firstGenre = group[0].chapter[0].genre;
              const genre = group.every((g) => g.chapter[0].genre === firstGenre) ? firstGenre : undefined;
              const meta = genre ? GENRE_META[genre] : undefined;
              return (
                <details
                  key={gi}
                  open={gi === openGroupIndex}
                  className="border border-line rounded-[14px] bg-white overflow-hidden"
                >
                  <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-warm transition-colors">
                    <span className="flex-1 min-w-0">
                      {meta ? (
                        <>
                          <b className="font-bold text-[14.5px]">
                            {meta.icon} {meta.label}
                          </b>
                          <small className="block text-[11.5px] text-faint font-normal truncate">
                            {meta.blurb} · Chapters {first}–{last}
                          </small>
                        </>
                      ) : (
                        <b className="font-bold text-[14.5px]">
                          Chapters {first}–{last}
                        </b>
                      )}
                    </span>
                    <span className="flex-none flex items-center gap-2">
                      <span className="w-[74px] h-1.5 rounded-full bg-line overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-sky-deep"
                          style={{ width: `${(groupDone / group.length) * 100}%` }}
                        />
                      </span>
                      <small className="text-[12px] text-muted font-semibold tabular-nums">
                        {groupDone}/{group.length}
                      </small>
                      <span className="text-faint text-[11px]">▾</span>
                    </span>
                  </summary>
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-dashed border-line">
                    <ChapterPathGroup
                      dividerEvery={DIVIDER_EVERY}
                      lineColorClassName="border-sky-line"
                      hoverClassName="hover:bg-[#EFF6FF]"
                      nodes={group.map(({ chapter, status, index: i }) => {
                        const passage = chapter[0];
                        const style = STATUS_STYLE[status];
                        return {
                          key: i,
                          href: status === "locked" ? undefined : `/reading/session?chapter=${i}&level=${level}`,
                          circleClassName: style.seed,
                          ringClassName: status === "current" ? "ring-4 ring-sky-line/60" : undefined,
                          circleContent: style.icon,
                          title: `Chapter ${i + 1}`,
                          subtitle: passage.title_en,
                          badgeClassName: style.badge,
                          badgeLabel: status === "done" ? "Done" : status === "current" ? "Read" : "Locked",
                          dim: status === "locked",
                        };
                      })}
                    />
                  </div>
                </details>
              );
            })}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
