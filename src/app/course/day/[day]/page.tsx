import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import Character, { characterColor, characterVariant } from "@/components/listening/Character";
import ChapterQuiz from "@/components/course/ChapterQuiz";
import CompleteButton from "@/components/course/CompleteButton";
import ExampleList from "@/components/course/ExampleList";
import StrokeGrid from "@/components/course/StrokeGrid";
import WritingTest from "@/components/course/WritingTest";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { COURSE_TOTAL_DAYS, DAY_QUIZZES, getCourseDay } from "@/lib/course";
import { COURSE_DEEP_DIVES, lessonByKey } from "@/lib/grammar";

// A course day is a lesson page in the same reading style as the grammar
// lessons: intro banner, then explanation sections top-to-bottom. Audio and
// stroke animations are inline; the only interactive block is the Day 16 test.
export default async function CourseDayPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day: dayParam } = await params;
  const dayNum = Number(dayParam);
  const day = Number.isInteger(dayNum) ? getCourseDay(dayNum) : null;
  if (!day) notFound();

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");
  const uid = user.id;

  const [{ data: profile }, { data: progress }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, streak_days, avatar_url")
      .eq("id", uid)
      .single(),
    supabase
      .from("path_progress")
      .select("step_key")
      .eq("user_id", uid)
      .eq("step_key", day.key),
  ]);
  const isDone = (progress ?? []).length > 0;

  const intro = day.phases.find((p) => p.type === "intro");
  const sections = day.phases.filter((p) => p.type !== "intro");

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
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px] flex-wrap">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <Link href="/course" className="hover:text-[#18181B] transition-colors">
              16-Day Course
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Day {day.day}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] items-center justify-center text-[13px] font-extrabold mr-[9px]">
                {day.day}
              </span>
              <span className="kr">{day.titleKr}</span>
            </h1>
            <span className="text-[13px] text-[#6B6560]">
              Day {day.day}/{COURSE_TOTAL_DAYS} · ~{day.minutes} min · {day.title}
            </span>
          </div>

          {/* intro banner with the guide mascot */}
          {intro && intro.type === "intro" && (
            <div className="max-w-[720px] border border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-[18px] py-4 mb-7 flex items-center gap-4 flex-wrap">
              <span className="flex-none">
                <Character
                  color={characterColor(day.day)}
                  variant={characterVariant(day.day)}
                  talking={false}
                  size={64}
                />
              </span>
              <div className="flex-1 min-w-[220px]">
                <p className="kr font-extrabold text-[16px]">{intro.kr}</p>
                <p className="text-[13.5px] text-[#6B6560]">{intro.en}</p>
              </div>
            </div>
          )}

          {/* sections, top to bottom like a grammar lesson */}
          <div className="max-w-[720px] grid gap-8">
            {sections.map((phase, i) => {
              const heading = (title: string) => (
                <h2 className="font-bold text-[16.5px] tracking-[-0.01em] mb-2.5">
                  <span className="text-[#16A34A] mr-1.5">{i + 1}.</span>
                  {title}
                </h2>
              );

              if (phase.type === "concept") {
                return (
                  <section key={i}>
                    {heading(phase.title)}
                    <p className="text-[14px] text-[#3F3F46] leading-[1.7] mb-3.5">{phase.body}</p>
                    <ExampleList items={phase.examples} />
                  </section>
                );
              }
              if (phase.type === "stroke") {
                return (
                  <section key={i}>
                    {heading("Stroke order — tap a card to replay it with sound")}
                    <StrokeGrid chars={phase.chars} />
                    <p className="text-[13px] text-[#6B6560] mt-2.5">{phase.note}</p>
                  </section>
                );
              }
              if (phase.type === "speak") {
                return (
                  <section key={i}>
                    {heading(phase.title)}
                    <ExampleList items={phase.items} />
                    <p className="text-[12.5px] text-[#A19A8C] mt-2">
                      Tap 🔊 to listen, then read it out loud.
                    </p>
                  </section>
                );
              }
              if (phase.type === "quiz") {
                return (
                  <section key={i}>
                    {heading("Writing test")}
                    <WritingTest
                      userId={uid}
                      stepKey={day.key}
                      minutes={day.minutes}
                      questions={phase.questions}
                      initiallyDone={isDone}
                    />
                  </section>
                );
              }
              return null;
            })}

            {/* deep-dive links into the Grammar reference */}
            {COURSE_DEEP_DIVES[day.day] && (
              <section className="border border-[#C7D2FE] bg-[#EEF2FF] rounded-[14px] px-5 py-4">
                <b className="block text-[13.5px] mb-2">
                  Go deeper <span className="text-[#6B6560] font-medium">· Grammar deep dives</span>
                </b>
                <div className="grid gap-1.5">
                  {COURSE_DEEP_DIVES[day.day].map((key) => {
                    const lesson = lessonByKey(key);
                    if (!lesson) return null;
                    return (
                      <Link
                        key={key}
                        href={`/grammar/${key}`}
                        className="flex items-center gap-2 text-[13.5px] font-semibold text-[#4F46E5] hover:underline"
                      >
                        <span>→ {lesson.title}</span>
                        <span className="kr text-[12px] font-medium text-[#6B6560]">{lesson.krTitle}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* optional practice quiz — extra study only, never gates completion */}
            {DAY_QUIZZES[day.day] && <ChapterQuiz questions={DAY_QUIZZES[day.day]} />}

            {/* completion — day 16 completes via the test instead */}
            {!day.phases.some((p) => p.type === "quiz") && (
              <section className="border-t border-[#E3DDD0] pt-6">
                <CompleteButton
                  userId={uid}
                  stepKey={day.key}
                  day={day.day}
                  minutes={day.minutes}
                  initiallyDone={isDone}
                />
              </section>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
