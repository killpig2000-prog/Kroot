import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import PronunciationChallenge from "@/components/pronunciation/PronunciationChallenge";
import PracticeGroups, { type ChapterProgress } from "@/components/pronunciation/PracticeGroups";
import ChallengeList, { type ChallengeState } from "@/components/pronunciation/ChallengeList";
import ChallengePlay from "@/components/pronunciation/ChallengePlay";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { isTableMissing } from "@/lib/resume";
import { getUnpaidRewardKeys } from "@/lib/reward-status";
import { pronunciationChapterKey, challengeKey } from "@/lib/reward-keys";
import {
  CHALLENGES,
  GROUP_FAMILY,
  PERFECT_SCORE,
  SOUND_GROUPS,
  challengeByKey,
  groupByKey,
  starsFor,
  type ChallengeResult,
} from "@/lib/pronunciation";

const TAB = "inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px] text-[13.5px] font-bold transition-colors";

export default async function SpeakingPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; challenge?: string; tab?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const t = await getTranslations("pronunciation");
  const tn = await getTranslations("nav");

  const [{ data: profile }, { data: progressRows }, challengeRes, unpaidKeys] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase.from("speaking_progress").select("prompt_key, best_score").eq("user_id", user.id),
    supabase
      .from("challenge_progress")
      .select("challenge_key, best_accuracy, best_ms")
      .eq("user_id", user.id),
    // Practice chapters and challenges are both p_skill 'pronunciation' —
    // told apart by item_key prefix ("pronunciation:" vs "challenge:").
    getUnpaidRewardKeys(supabase, user.id, "pronunciation"),
  ]);

  const bestScores: Record<string, number> = {};
  for (const r of progressRows ?? []) bestScores[r.prompt_key] = r.best_score;

  // Migration 0038 may not have reached this environment yet — with no table
  // the challenge tab still works, it just shows no personal bests.
  const challengeBest = new Map<string, ChallengeResult>();
  if (!challengeRes.error || !isTableMissing(challengeRes.error)) {
    for (const r of challengeRes.data ?? []) {
      challengeBest.set(r.challenge_key, { accuracy: r.best_accuracy ?? 0, ms: r.best_ms ?? 0 });
    }
  }

  // Practice chapters: nothing locked, nothing ordered. "Done" is every word
  // attempted; the rainbow ring needs every word at 100.
  const chapters: ChapterProgress[] = SOUND_GROUPS.map((g) => {
    const attempted = g.items.filter((w) => `${g.key}:${w.kr}` in bestScores).length;
    const perfect = g.items.filter((w) => (bestScores[`${g.key}:${w.kr}`] ?? 0) >= PERFECT_SCORE).length;
    return { ...g, total: g.items.length, attempted, perfect, coinAvailable: unpaidKeys.has(pronunciationChapterKey(g.key)) };
  });
  const chaptersDone = chapters.filter((c) => c.total > 0 && c.attempted === c.total);
  const doneByFamily = (family: string) =>
    chaptersDone.filter((c) => GROUP_FAMILY[c.key] === family).length;

  const isAdmin = isAdminEmail(user.email);

  // Challenges unlock off practice progress and stars earned; the owner
  // account sees them all for testing.
  const challengeStates: ChallengeState[] = CHALLENGES.map((c) => {
    const best = challengeBest.get(c.key) ?? null;
    const stars = starsFor(c, best);
    return { challenge: c, best, stars, coinAvailable: unpaidKeys.has(challengeKey(c.key)) };
  }).map((s, _i, all) => {
    const totalStars = all.reduce((n, x) => n + x.stars, 0);
    const req = s.challenge.requires;
    if (!req || isAdmin) return { ...s, locked: false };
    if (req.type === "chapters") {
      const have = doneByFamily(req.family);
      return have >= req.count
        ? { ...s, locked: false }
        : { ...s, locked: true, lockNote: t("challenge.lockChapters", { count: req.count, have }) };
    }
    return totalStars >= req.count
      ? { ...s, locked: false }
      : { ...s, locked: true, lockNote: t("challenge.lockStars", { count: req.count, have: totalStars }) };
  });

  const sp = await searchParams;
  const openChapter = sp.chapter ? groupByKey(sp.chapter) : undefined;
  const requestedChallenge = sp.challenge ? challengeByKey(sp.challenge) : undefined;
  const openChallenge =
    requestedChallenge && !challengeStates.find((s) => s.challenge.key === requestedChallenge.key)?.locked
      ? requestedChallenge
      : undefined;

  const onChallengeTab = sp.tab === "challenge" || !!openChallenge;
  const playing = !!openChapter || !!openChallenge;

  const perfectCount = chapters.filter((c) => c.total > 0 && c.perfect === c.total).length;
  const starsEarned = challengeStates.reduce((n, s) => n + s.stars, 0);

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start md:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
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
            <b className="text-charcoal font-semibold">{t("title")}</b>
          </div>

          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-teal)] text-teal border border-[var(--tint-teal-line)] items-center justify-center kr text-[15px] mr-[9px]">
                발
              </span>
              {t("title")}
            </h1>
            <span className="text-[13px] text-muted tabular-nums">
              {onChallengeTab
                ? t("headerStars", { n: starsEarned })
                : perfectCount > 0
                  ? t("headerPerfect", { done: chaptersDone.length, total: chapters.length, perfect: perfectCount })
                  : t("headerPractice", { done: chaptersDone.length, total: chapters.length })}
            </span>
          </div>

          {!playing && (
            <div className="inline-flex bg-warm-2 border border-line rounded-[12px] p-1 gap-1 mb-6">
              <Link href="/speaking" className={`${TAB} ${onChallengeTab ? "text-muted" : "bg-cream shadow-sm"}`}>
                🎯 {t("tabs.practice")}
              </Link>
              <Link
                href="/speaking?tab=challenge"
                className={`${TAB} ${onChallengeTab ? "bg-cream shadow-sm text-[var(--c-danger)]" : "text-muted"}`}
              >
                🔥 {t("tabs.challenge")}
              </Link>
            </div>
          )}

          {openChallenge ? (
            <ChallengePlay
              key={openChallenge.key}
              challenge={openChallenge}
              userId={user.id}
              initialBest={challengeBest.get(openChallenge.key) ?? null}
            />
          ) : openChapter ? (
            <PronunciationChallenge
              key={openChapter.key}
              chapterKey={openChapter.key}
              userId={user.id}
              initialBestScores={bestScores}
            />
          ) : onChallengeTab ? (
            <ChallengeList items={challengeStates} />
          ) : (
            <PracticeGroups chapters={chapters} />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
