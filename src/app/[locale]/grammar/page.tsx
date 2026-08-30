import LevelTabs from "@/components/ui/LevelTabs";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { GRAMMAR_GROUPS, GRAMMAR_LESSONS, lessonByKey, lessonsByLevel, getLocalizedLesson, getLocalizedGrammarGroup } from "@/lib/grammar";
import { isDifficultyUnlocked } from "@/lib/level";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";

export default async function GrammarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string; group?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { locale } = await params;
  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const sp = await searchParams;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;

  // "Start here" / "Next steps" sit as pills in the same row as the CEFR
  // levels — a ?group= param picks one instead of a level, so there's one
  // lesson list on screen at a time rather than three stacked sections.
  const selectedGroup = sp.group ? GRAMMAR_GROUPS.find((g) => g.key === sp.group) ?? null : null;
  const groupLessons = selectedGroup
    ? (
        await Promise.all(
          selectedGroup.lessonKeys.map((k) => getLocalizedLesson(k, locale))
        )
      ).filter((l): l is NonNullable<typeof l> => Boolean(l))
    : [];
  const levelLessons = lessonsByLevel(level);
  const shownLessons = selectedGroup ? groupLessons : levelLessons;

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

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-indigo)] text-[var(--tint-indigo-ink)] border border-[var(--tint-indigo-line)] items-center justify-center kr text-[15px] mr-[9px]">
                문
              </span>
              Grammar
            </h1>
            <span className="text-[13px] text-muted">
              {GRAMMAR_LESSONS.length} lessons
            </span>
          </div>

          {/* one tab row: curated groups, then every CEFR level — one lesson
              list on screen at a time instead of three stacked sections. */}
          <section className="max-w-[820px] mb-8">
            <div className="flex gap-2 mb-4 flex-wrap">
              {GRAMMAR_GROUPS.map((group) => (
                <Link
                  key={group.key}
                  href={`/grammar?group=${group.key}`}
                  className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                    selectedGroup?.key === group.key
                      ? "bg-[#423AC5] border-[#423AC5] text-white"
                      : "bg-cream border-line text-muted hover:border-faint"
                  }`}
                >
                  {group.title}
                </Link>
              ))}
            </div>
            <LevelTabs
              className="mb-4"
              levels={LEVEL_ORDER}
              current={selectedGroup ? myLevel : level}
              mine={myLevel}
              unlocked={(lv) => isDifficultyUnlocked(lv, myLevel)}
              href={(lv) => `/grammar?level=${lv}`}
              accent="bg-[#423AC5] border-[#423AC5] text-white"
            />

            <div className="flex items-center gap-2.5 mb-3">
              {selectedGroup && (
                <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-faint">
                  <span className="kr normal-case">{selectedGroup.titleKr}</span> · {selectedGroup.title}
                </span>
              )}
              <span className="h-px flex-1 bg-line" />
              <span className="text-[12px] text-faint">{shownLessons.length} lessons</span>
            </div>

            <div className="border border-line rounded-[14px] overflow-hidden">
              {shownLessons.map((lesson, i) => (
                <Link
                  key={lesson.key}
                  href={`/grammar/${lesson.key}`}
                  className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-cream transition-all duration-150 hover:bg-[var(--tint-indigo)] group ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <span className="flex-none w-8 h-8 rounded-[10px] bg-warm border border-line flex items-center justify-center text-[12.5px] font-bold text-muted transition-all group-hover:bg-[#423AC5] group-hover:border-[#423AC5] group-hover:text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-semibold text-[15px] leading-[1.35]">
                      {lesson.title}
                    </b>
                    <span className="kr block text-[12.5px] font-medium text-faint whitespace-nowrap truncate mb-0.5">
                      {lesson.krTitle}
                    </span>
                    <small className="block text-[12.5px] text-muted leading-[1.5]">
                      {lesson.summary}
                    </small>
                  </span>
                  <span className="hidden sm:inline-block flex-none text-[11.5px] font-semibold text-[var(--tint-indigo-ink)] bg-[var(--tint-indigo)] border border-[var(--tint-indigo-line)] rounded-full px-2.5 py-[3px]">
                    {lesson.level}
                  </span>
                  <span className="flex-none text-[#D6D3CC] text-sm transition-all group-hover:text-[var(--tint-indigo-ink)] group-hover:translate-x-0.5">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
