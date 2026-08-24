import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { GRAMMAR_GROUPS, GRAMMAR_LESSONS, lessonByKey, lessonsByLevel } from "@/lib/grammar";
import { isDifficultyUnlocked } from "@/lib/level";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

export default async function GrammarPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const sp = await searchParams;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;
  const levelLessons = lessonsByLevel(level);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
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
            <b className="text-[#18181B] font-semibold">Grammar</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] items-center justify-center kr text-[15px] mr-[9px]">
                문
              </span>
              Grammar
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              {GRAMMAR_LESSONS.length} lessons · the patterns behind every sentence
            </span>
          </div>

          {/* intro */}
          <div className="max-w-[820px] bg-[#EEF2FF] border border-[#C7D2FE] rounded-[14px] px-[18px] py-4 mb-7">
            <p className="text-[13.5px] text-[#18181B] leading-[1.65]">
              Korean grammar is regular. The first group digs deeper into what the{" "}
              <Link href="/course" className="font-semibold text-[#4F46E5] hover:underline">
                16-Day Course
              </Link>{" "}
              teaches as chunks; the second is what to learn right after finishing it. Below those,
              the full A1–C2 syllabus is browsable by level.
            </p>
          </div>

          {GRAMMAR_GROUPS.map((group) => {
            const lessons = group.lessonKeys
              .map((k) => lessonByKey(k))
              .filter((l): l is NonNullable<typeof l> => Boolean(l));
            if (lessons.length === 0) return null;
            return (
              <section key={group.key} className="max-w-[820px] mb-8">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C]">
                    <span className="kr normal-case">{group.titleKr}</span> · {group.title}
                  </span>
                  <span className="h-px flex-1 bg-[#E3DDD0]" />
                  <span className="text-[12px] text-[#A19A8C]">{lessons.length} lessons</span>
                </div>
                <p className="text-[12.5px] text-[#6B6560] mb-3">{group.sub}</p>

                <div className="border border-[#E3DDD0] rounded-[14px] overflow-hidden">
                  {lessons.map((lesson, i) => (
                    <Link
                      key={lesson.key}
                      href={`/grammar/${lesson.key}`}
                      className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-white transition-all duration-150 hover:bg-[#EEF2FF] group ${
                        i > 0 ? "border-t border-[#E3DDD0]" : ""
                      }`}
                    >
                      <span className="flex-none w-8 h-8 rounded-[10px] bg-[#FAF7EF] border border-[#E3DDD0] flex items-center justify-center text-[12.5px] font-bold text-[#6B6560] transition-all group-hover:bg-[#4F46E5] group-hover:border-[#4F46E5] group-hover:text-white">
                        {GRAMMAR_LESSONS.indexOf(lesson) + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block font-semibold text-[15px] mb-0.5">
                          {lesson.title}
                          <span className="kr text-[12.5px] font-medium text-[#A19A8C] ml-2">
                            {lesson.krTitle}
                          </span>
                        </b>
                        <small className="block text-[12.5px] text-[#6B6560] leading-[1.5]">
                          {lesson.summary}
                        </small>
                      </span>
                      <span className="flex-none text-[11.5px] font-semibold text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE] rounded-full px-2.5 py-[3px]">
                        {lesson.level}
                      </span>
                      <span className="flex-none text-[#D6D3CC] text-sm transition-all group-hover:text-[#4F46E5] group-hover:translate-x-0.5">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* browse the whole syllabus by CEFR level */}
          <section className="max-w-[820px] mb-8">
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C]">
                <span className="kr normal-case">단계별</span> · Browse by level
              </span>
              <span className="h-px flex-1 bg-[#E3DDD0]" />
              <span className="text-[12px] text-[#A19A8C]">{levelLessons.length} lessons</span>
            </div>
            <p className="text-[12.5px] text-[#6B6560] mb-3">
              Every lesson, ordered A1 to C2. Higher tiers open once you pass the promotion test.
            </p>

            <div className="flex gap-2 mb-4 flex-wrap">
              {LEVEL_ORDER.map((lv) =>
                isDifficultyUnlocked(lv, myLevel) ? (
                  <Link
                    key={lv}
                    href={`/grammar?level=${lv}`}
                    className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                      lv === level
                        ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                        : "bg-white border-[#E3DDD0] text-[#6B6560] hover:border-[#A19A8C]"
                    }`}
                  >
                    {lv}
                    {lv === myLevel && (
                      <span className="text-[10.5px] font-bold ml-1.5 opacity-85">· your level</span>
                    )}
                  </Link>
                ) : (
                  <div
                    key={lv}
                    className="rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold border bg-[#FAF7EF] border-[#E3DDD0] text-[#A19A8C] grayscale opacity-60 cursor-not-allowed select-none"
                  >
                    🔒 {lv}
                    <span className="text-[10.5px] font-bold ml-1.5">· promotion test</span>
                  </div>
                )
              )}
            </div>

            <div className="border border-[#E3DDD0] rounded-[14px] overflow-hidden">
              {levelLessons.map((lesson, i) => (
                <Link
                  key={lesson.key}
                  href={`/grammar/${lesson.key}`}
                  className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-white transition-all duration-150 hover:bg-[#EEF2FF] group ${
                    i > 0 ? "border-t border-[#E3DDD0]" : ""
                  }`}
                >
                  <span className="flex-none w-8 h-8 rounded-[10px] bg-[#FAF7EF] border border-[#E3DDD0] flex items-center justify-center text-[12.5px] font-bold text-[#6B6560] transition-all group-hover:bg-[#4F46E5] group-hover:border-[#4F46E5] group-hover:text-white">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block font-semibold text-[15px] mb-0.5">
                      {lesson.title}
                      <span className="kr text-[12.5px] font-medium text-[#A19A8C] ml-2">
                        {lesson.krTitle}
                      </span>
                    </b>
                    <small className="block text-[12.5px] text-[#6B6560] leading-[1.5]">
                      {lesson.summary}
                    </small>
                  </span>
                  <span className="flex-none text-[11.5px] font-semibold text-[#4F46E5] bg-[#EEF2FF] border border-[#C7D2FE] rounded-full px-2.5 py-[3px]">
                    {lesson.level}
                  </span>
                  <span className="flex-none text-[#D6D3CC] text-sm transition-all group-hover:text-[#4F46E5] group-hover:translate-x-0.5">
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
