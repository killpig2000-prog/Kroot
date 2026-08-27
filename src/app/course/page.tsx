import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { COURSE_SECTIONS, COURSE_TOTAL_DAYS, nextCourseDay } from "@/lib/course";

// Course overview: the whole 16-day chain at a glance, grouped into the
// consonants/vowels course and the grammar course. Sessions themselves are
// hands-free; this page is the only "map".
export default async function CourseOverviewPage() {
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
    supabase.from("path_progress").select("step_key").eq("user_id", uid),
  ]);

  const doneKeys = new Set((progress ?? []).map((r) => r.step_key));
  const next = nextCourseDay(doneKeys);
  const doneCount = COURSE_SECTIONS.flatMap((s) => s.days).filter((d) => doneKeys.has(d.key)).length;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[760px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">16-Day Course</b>
          </div>

          {/* hero */}
          <div className="border border-line rounded-[16px] p-6 flex gap-[18px] items-center flex-wrap mb-7">
            <span className="w-16 h-16 rounded-[14px] bg-success-bg border border-success-line flex items-center justify-center text-[30px] flex-none">
              🧭
            </span>
            <div className="flex-1 min-w-[230px]">
              <h1 className="font-extrabold text-[21px] tracking-[-0.02em] [text-wrap:balance]">
                16-Day Course — from the alphabet to if-clauses
              </h1>
              <p className="text-[13.5px] text-muted">
                {doneCount}/{COURSE_TOTAL_DAYS} days done · read-style lessons, binge as many as you like
              </p>
            </div>
            {next && (
              <Link
                href={`/course/day/${next.day}`}
                className="flex-none bg-success hover:bg-success-deep text-white rounded-[10px] px-5 py-3 text-[14px] font-bold transition-colors"
              >
                ▶ Start Day {next.day}
              </Link>
            )}
          </div>

          {/* chain */}
          {COURSE_SECTIONS.map((section) => (
            <section key={section.key} className="mb-8">
              <h2 className="font-extrabold text-[16px] tracking-[-0.01em]">
                <span className="kr">{section.titleKr}</span>
                <span className="text-faint font-semibold text-[13px]"> · {section.title}</span>
              </h2>
              <p className="text-[12.5px] text-muted mb-4">{section.sub}</p>

              <ol className="relative ml-[18px] border-l-2 border-line">
                {section.days.map((d) => {
                  const isDone = doneKeys.has(d.key);
                  const isNext = next?.day === d.day;
                  return (
                    <li key={d.key} className="relative pl-7 pb-5 last:pb-1">
                      {/* chain node */}
                      <span
                        className={`absolute -left-[15px] top-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[12px] font-bold bg-white ${
                          isDone
                            ? "border-success bg-success text-white"
                            : isNext
                              ? "border-[#FF9E7D] text-[#FF9E7D]"
                              : "border-line text-faint"
                        }`}
                      >
                        {isDone ? "✓" : d.day}
                      </span>

                      <Link
                        href={`/course/day/${d.day}`}
                        className={`block border rounded-[12px] px-4 py-3 transition-colors ${
                          isNext
                            ? "border-[#FF9E7D] bg-[#FFF7ED] hover:border-[#f08560]"
                            : isDone
                              ? "border-success-line bg-success-bg hover:border-success"
                              : "border-line bg-white hover:border-success"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex-1 min-w-[200px]">
                            <b className="block text-[14.5px] tracking-[-0.01em]">
                              <span className="kr">{d.titleKr}</span>
                            </b>
                            <span className="text-[12.5px] text-muted">{d.title}</span>
                          </div>
                          <span className="flex-none text-[12px] text-faint font-semibold tabular-nums">
                            {isNext ? "← up next" : isDone ? "done" : `~${d.minutes} min`}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
