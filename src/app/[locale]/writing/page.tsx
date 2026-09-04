import LevelTabs from "@/components/ui/LevelTabs";
import { Link, redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ChapterPathGroup from "@/components/chapters/ChapterPathGroup";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import {
  getChapterStatuses,
  getChaptersForLevel,
  WRITING_GENRE_META,
} from "@/lib/writing";
import { getLocalizedPrompt } from "@/lib/writing-i18n";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";
import { getUnpaidRewardKeys } from "@/lib/reward-status";
import { writingChapterKey } from "@/lib/reward-keys";

const STATUS_BADGE: Record<string, string> = {
  done: "bg-success-bg text-success border-success-line",
  current: "bg-[var(--tint-amber)] text-amber border-amber-line",
  locked: "bg-warm text-faint border-line",
};

export default async function WritingMapPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [t, tn, tu, locale, { data: profile }, { data: progress }, sp, unpaidKeys] = await Promise.all([
    getTranslations("writing"),
    getTranslations("nav"),
    getTranslations("ui"),
    getLocale(),
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, xp")
      .eq("id", user.id)
      .single(),
    supabase.from("writing_progress").select("prompt_key, completed_at").eq("user_id", user.id),
    searchParams,
    getUnpaidRewardKeys(supabase, user.id, "writing"),
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;
  const chapters = getChaptersForLevel(level);

  const completedKeys = new Set((progress ?? []).map((p) => p.prompt_key));
  const statuses = getChapterStatuses(chapters, completedKeys);
  const doneCount = statuses.filter((s) => s === "done").length;

  // 40 chapters is a long scroll — group into one collapsible set per genre
  // (a run of consecutive chapters sharing a genre), with the set containing
  // the current chapter open. Inside, a divider every ten.
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
  const continueChapter = continueIndex >= 0 ? chapters[continueIndex] : null;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
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
              {tn("garden")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{t("crumb")}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-amber)] text-amber border border-amber-line items-center justify-center kr text-[15px] mr-[9px]">
                쓰
              </span>
              {t("crumb")}
            </h1>
            <span className="text-[13px] text-muted">{t("map.levelSub", { level })}</span>
          </div>


          <GuidedStep step="writing-level" />
          <GuidedStep step="writing-chapter" />

          <LevelTabs
            className="mb-6"
            tourId="guided-writing-level"
            levels={LEVEL_ORDER}
            current={level}
            mine={myLevel}
            unlocked={(lv) => isDifficultyUnlocked(lv, myLevel)}
            href={(lv) => `/writing?level=${lv}`}
            accent="bg-amber border-amber text-white"
          />

          {/* progress */}
          <div className="max-w-[720px] mb-6">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-[12.5px] text-muted mb-2">
              <span>{t("map.progress", { done: doneCount, total: chapters.length })}</span>
              <span className="text-faint">{t("map.genresNote")}</span>
            </div>
            <div className="h-1.5 rounded-full bg-line overflow-hidden">
              <div
                className="h-full rounded-full bg-amber transition-all"
                style={{ width: `${chapters.length ? (doneCount / chapters.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* continue card: one obvious next step above the chapter groups */}
          {continueChapter && (
            <Link
              href={`/writing/session?chapter=${continueIndex}&level=${level}`}
              className="flex items-center gap-3.5 border-[1.5px] border-amber-line bg-[var(--tint-amber)] rounded-[14px] px-5 py-4 mb-6 max-w-[720px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-cream border border-amber-line flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                ✏️
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#B45309]">
                  {t("map.continueChapter", { n: continueIndex + 1 })}
                </b>
                <span className="text-[13px] text-[#92702B] truncate block">
                  {t("map.questionsOf", { n: continueChapter.length, prompt: getLocalizedPrompt(continueChapter[0], locale) })}
                </span>
              </span>
              <span className="text-[13px] font-semibold text-amber transition-transform group-hover:translate-x-0.5">
                {t("map.write")}
              </span>
            </Link>
          )}

          <div className="grid gap-3 max-w-[720px]">
            {groups.map((group, gi) => {
              const first = group[0].index + 1;
              const last = group[group.length - 1].index + 1;
              const groupDone = group.filter((g) => g.status === "done").length;
              const genre = group[0].chapter[0].genre;
              const meta = WRITING_GENRE_META[genre];
              return (
                <details
                  key={gi}
                  open={gi === openGroupIndex}
                  className="border border-line rounded-[14px] bg-cream overflow-hidden"
                >
                  {/* The walkthrough rings the header row, not the whole
                      box — open, the first group runs off the screen. */}
                  <summary
                    data-tour={gi === 0 ? "guided-writing-groups" : undefined}
                    className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-warm transition-colors">
                    <span className="flex-1 min-w-0">
                      <b className="font-bold text-[14.5px]">
                        {meta.icon} {t(`genres.${genre}.label`)}
                      </b>
                      <small className="block text-[11.5px] text-faint font-normal truncate">
                        {t("map.chaptersRange", { first, last })}
                      </small>
                    </span>
                    <span className="flex-none flex items-center gap-2">
                      <span className="w-[74px] h-1.5 rounded-full bg-line overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-amber"
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
                      lineColorClassName="border-amber-line"
                      hoverClassName="hover:bg-[var(--tint-amber)]"
                      nodes={group.map(({ chapter, status, index: i }) => {
                        const dim = status === "locked";
                        return {
                          key: i,
                          href: dim ? undefined : `/writing/session?chapter=${i}&level=${level}`,
                          circleClassName:
                            status === "done"
                              ? "bg-success-bg text-success border-success-line"
                              : status === "current"
                              ? "bg-[var(--tint-amber)] text-amber border-amber-line"
                              : "bg-warm text-faint border-line",
                          ringClassName: status === "current" ? "ring-4 ring-amber-line/60" : undefined,
                          circleContent: status === "done" ? "✓" : i + 1,
                          title: t("map.chapterN", { n: i + 1 }),
                          // Just the first question's prompt, no "N questions ·"
                          // prefix — keeps this to one line instead of wrapping.
                          subtitle: getLocalizedPrompt(chapter[0], locale),
                          badgeClassName: STATUS_BADGE[status],
                          badgeLabel:
                            status === "done"
                              ? t("map.statusDone")
                              : status === "current"
                                ? t("map.statusWrite")
                                : t("map.statusLocked"),
                          coinBadgeLabel: unpaidKeys.has(writingChapterKey(level, i)) ? tu("coinAvailable") : undefined,
                          dim,
                          tourId: i === 0 ? "guided-writing-chapter" : undefined,
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
