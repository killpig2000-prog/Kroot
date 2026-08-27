import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import TestRunner from "@/components/level-test/TestRunner";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { computeEligibility, getLastServedKeys } from "@/lib/promotion-server";
import { levelFromXp } from "@/lib/level";
import { SKILL_LABELS, buildServedTest, testForGrade, type SkillScores } from "@/lib/promotion-test";
import type { CefrLevel } from "@/lib/tree";

// Promotion test hub: shows eligibility progress for the current grade and,
// once every requirement is met, the actual four-skill test.
export default async function LevelTestPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, streak_days, avatar_url, current_level, xp")
    .eq("id", user.id)
    .single();

  const grade = (profile?.current_level ?? "A1") as CefrLevel;
  const spec = testForGrade(grade);
  const elig = spec ? await computeEligibility(supabase, user.id, grade) : null;

  const bar = (value: number, target: number) => (
    <span className="flex-1 h-2.5 rounded-full bg-[#F5F5F4] overflow-hidden">
      <span
        className={`block h-full rounded-full ${value >= target ? "bg-success" : "bg-[#F59E0B]"}`}
        style={{ width: `${Math.min(100, Math.round((value / target) * 100))}%` }}
      />
    </span>
  );

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[680px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Level Test</b>
          </div>

          <h1 className="font-bold text-[22px] tracking-[-0.02em] mb-1">
            🎯 Level-Up Test {spec && `— ${spec.from} → ${spec.to}`}
          </h1>
          <p className="text-[13.5px] text-muted mb-6">
            Hold onto enough of your current grade and the test unlocks on its own. Pass it to open the next grade&apos;s content.
          </p>

          {!spec ? (
            <div className="border border-line rounded-[14px] px-5 py-5 text-[14px]">
              {grade === "C2"
                ? "You\u2019re already at the top grade (C2)! 🏆"
                : `The ${grade} level-up test is coming soon.`}
            </div>
          ) : !elig ? null : elig.eligible ? (
            <TestRunner
              userId={user.id}
              spec={buildServedTest(spec, undefined, await getLastServedKeys(supabase, user.id, spec.to))}
              playerLevel={levelFromXp(profile?.xp ?? 0)}
            />
          ) : (
            <div className="grid gap-4">
              <div className="border border-line rounded-[14px] p-5 grid gap-3.5">
                <b className="text-[14.5px]">Requirements — what you&apos;re holding onto at {grade}</b>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="flex-none w-[130px]">Words held</span>
                  {bar(elig.wordsMastered, elig.wordsRequired)}
                  <b className="flex-none tabular-nums">
                    {elig.wordsMastered}/{elig.wordsRequired}
                  </b>
                </div>
                <p className="text-[12px] text-muted -mt-1.5">
                  A word counts once it survives its first two reviews — you&apos;ve studied{" "}
                  {elig.wordsSeen} {grade} {elig.wordsSeen === 1 ? "word" : "words"} so far.
                </p>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="flex-none w-[130px]">Reading passages</span>
                  {bar(elig.readingDone, elig.readingRequired)}
                  <b className="flex-none tabular-nums">
                    {elig.readingDone}/{elig.readingRequired}
                  </b>
                </div>
              </div>

              {elig.cooldownUntil ? (
                <div className="border border-amber-line bg-[#FFFBEB] rounded-[14px] px-5 py-4 text-[13.5px]">
                  <b>Retake cooldown</b> — you can try again after{" "}
                  {new Date(elig.cooldownUntil).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  .
                  {elig.lastWeakest && SKILL_LABELS[elig.lastWeakest as keyof SkillScores] && (
                    <>
                      {" "}
                      Meanwhile, practice{" "}
                      <Link
                        href={SKILL_LABELS[elig.lastWeakest as keyof SkillScores].href}
                        className="font-bold text-success hover:underline"
                      >
                        {SKILL_LABELS[elig.lastWeakest as keyof SkillScores].en} →
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  Keep studying {grade} vocabulary and reading to fill the gauges. When every bar is full, the test opens right here.
                </p>
              )}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
