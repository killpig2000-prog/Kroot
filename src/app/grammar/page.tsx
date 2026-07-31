import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient } from "@/lib/supabase/server";
import { GRAMMAR_GROUPS, GRAMMAR_LESSONS, lessonByKey } from "@/lib/grammar";

export default async function GrammarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-white text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A1A1AA] mb-[18px]">
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
            <span className="text-[13px] text-[#71717A]">
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
              teaches as chunks; the second group is what to learn right after finishing it.
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
                  <span className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A1A1AA]">
                    <span className="kr normal-case">{group.titleKr}</span> · {group.title}
                  </span>
                  <span className="h-px flex-1 bg-[#E7E5E4]" />
                  <span className="text-[12px] text-[#A1A1AA]">{lessons.length} lessons</span>
                </div>
                <p className="text-[12.5px] text-[#71717A] mb-3">{group.sub}</p>

                <div className="border border-[#E7E5E4] rounded-[14px] overflow-hidden">
                  {lessons.map((lesson, i) => (
                    <Link
                      key={lesson.key}
                      href={`/grammar/${lesson.key}`}
                      className={`flex items-center gap-3.5 px-[18px] py-[15px] bg-white transition-all duration-150 hover:bg-[#EEF2FF] group ${
                        i > 0 ? "border-t border-[#E7E5E4]" : ""
                      }`}
                    >
                      <span className="flex-none w-8 h-8 rounded-[10px] bg-[#FAFAF9] border border-[#E7E5E4] flex items-center justify-center text-[12.5px] font-bold text-[#71717A] transition-all group-hover:bg-[#4F46E5] group-hover:border-[#4F46E5] group-hover:text-white">
                        {GRAMMAR_LESSONS.indexOf(lesson) + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <b className="block font-semibold text-[15px] mb-0.5">
                          {lesson.title}
                          <span className="kr text-[12.5px] font-medium text-[#A1A1AA] ml-2">
                            {lesson.krTitle}
                          </span>
                        </b>
                        <small className="block text-[12.5px] text-[#71717A] leading-[1.5]">
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
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
