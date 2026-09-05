import { getFormatter, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
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
  const t = await getTranslations("levelTest");
  const tn = await getTranslations("nav");
  const format = await getFormatter();
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
    <span className="flex-1 h-2.5 rounded-full bg-[var(--tint-stone)] overflow-hidden">
      <span
        className={`block h-full rounded-full ${value >= target ? "bg-success" : "bg-[#F59E0B]"}`}
        style={{ width: `${Math.min(100, Math.round((value / target) * 100))}%` }}
      />
    </span>
  );

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start md:content-stretch">
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
              {tn("garden")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{t("breadcrumb")}</b>
          </div>

          <h1 className="font-bold text-[22px] tracking-[-0.02em] mb-1">
            🎯 {t("title")} {spec && t("titleLevels", { from: spec.from, to: spec.to })}
          </h1>
          <p className="text-[13.5px] text-muted mb-6">
            {t("intro")}
          </p>

          {!spec ? (
            <div className="border border-line rounded-[14px] px-5 py-5 text-[14px]">
              {grade === "C2" ? t("topGrade") : t("comingSoon", { grade })}
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
                <b className="text-[14.5px]">{t("requirements.title", { grade })}</b>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="flex-none w-[130px]">{t("requirements.wordsHeld")}</span>
                  {bar(elig.wordsMastered, elig.wordsRequired)}
                  <b className="flex-none tabular-nums">
                    {elig.wordsMastered}/{elig.wordsRequired}
                  </b>
                </div>
                <p className="text-[12px] text-muted -mt-1.5">
                  {t("requirements.wordsNote", { n: elig.wordsSeen, grade })}
                </p>
                <div className="flex items-center gap-3 text-[13px]">
                  <span className="flex-none w-[130px]">{t("requirements.readingPassages")}</span>
                  {bar(elig.readingDone, elig.readingRequired)}
                  <b className="flex-none tabular-nums">
                    {elig.readingDone}/{elig.readingRequired}
                  </b>
                </div>
              </div>

              {elig.cooldownUntil ? (
                <div className="border border-amber-line bg-[var(--tint-amber)] rounded-[14px] px-5 py-4 text-[13.5px]">
                  <b>{t("cooldown.label")}</b> —{" "}
                  {t("cooldown.body", {
                    date: format.dateTime(new Date(elig.cooldownUntil), {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                  })}
                  {elig.lastWeakest && SKILL_LABELS[elig.lastWeakest as keyof SkillScores] && (
                    <>
                      {" "}
                      <Link
                        href={SKILL_LABELS[elig.lastWeakest as keyof SkillScores].href}
                        className="font-bold text-success hover:underline"
                      >
                        {t("cooldown.practice", {
                          skill: t(`skills.${elig.lastWeakest as keyof SkillScores}`),
                        })}
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-muted">
                  {t("requirements.keepStudying", { grade })}
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
