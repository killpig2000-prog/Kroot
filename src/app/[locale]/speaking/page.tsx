import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import PronunciationChallenge from "@/components/pronunciation/PronunciationChallenge";
import PronunciationTrail, { type ChapterProgress } from "@/components/pronunciation/PronunciationTrail";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { orderedChapters, NAILED_THRESHOLD, TIER_META, type Chapter } from "@/lib/pronunciation";

export default async function SpeakingPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, { data: progressRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase.from("speaking_progress").select("prompt_key, best_score").eq("user_id", user.id),
  ]);

  const bestScores: Record<string, number> = {};
  for (const r of progressRows ?? []) bestScores[r.prompt_key] = r.best_score;
  const nailedIds = new Set(Object.keys(bestScores).filter((k) => bestScores[k] >= NAILED_THRESHOLD));
  // A row exists the moment a word is attempted, whatever the score — used
  // to gate progress, so a chapter clears (and the next tier can open) once
  // every word has been tried, not once every word scores 80+. `nailedIds`
  // (above) still drives the mastery count shown on each chapter's ring.
  const attemptedIds = new Set(Object.keys(bestScores));

  // Chapters unlock a whole tier at a time, not one another individually:
  // every chapter within a tier is open (in any order) as soon as the tier
  // itself is unlocked, and the next tier opens only once every chapter in
  // this one is fully attempted.
  const statsFor = (c: Chapter) => {
    const total = c.items.length;
    const nailed = c.items.filter((w) => nailedIds.has(`${c.key}:${w.kr}`)).length;
    const attempted = c.items.filter((w) => attemptedIds.has(`${c.key}:${w.kr}`)).length;
    return { total, nailed, cleared: total > 0 && attempted === total };
  };

  // The owner account gets every chapter open for testing/content review —
  // everyone else still climbs the tiers normally.
  const isAdmin = isAdminEmail(user.email);

  const allChapters = orderedChapters();
  const chapters: ChapterProgress[] = [];
  let tierUnlocked = true;
  for (const { tier } of TIER_META) {
    const tierChapters = allChapters.filter((c) => c.tier === tier).map((c) => ({ c, ...statsFor(c) }));
    const locked = !isAdmin && !tierUnlocked;
    for (const s of tierChapters) chapters.push({ ...s.c, total: s.total, nailed: s.nailed, cleared: s.cleared, locked });
    tierUnlocked = tierUnlocked && tierChapters.length > 0 && tierChapters.every((s) => s.cleared);
  }

  const current = chapters.find((c) => !c.locked && !c.cleared) ?? null;
  const totalWords = chapters.reduce((n, c) => n + c.total, 0);
  const totalCleared = chapters.filter((c) => c.cleared).length;

  const sp = await searchParams;
  const requested = sp.chapter ? chapters.find((c) => c.key === sp.chapter) : undefined;
  const playable = requested && !requested.locked ? requested : undefined;

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
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Pronunciation</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-teal)] text-teal border border-[var(--tint-teal-line)] items-center justify-center kr text-[15px] mr-[9px]">
                발
              </span>
              Pronunciation
              <span className="ml-2.5 text-[12.5px] font-semibold text-teal bg-[var(--tint-teal)] border border-[var(--tint-teal-line)] rounded-full px-2.5 py-[2px] tracking-normal">
                Trail
              </span>
            </h1>
            <span className="text-[13px] text-muted">
              {playable ? "Can you say it?" : `${totalCleared}/${chapters.length} chapters · ${totalWords} words`}
            </span>
          </div>

          {playable ? (
            <PronunciationChallenge
              key={playable.key}
              chapterKey={playable.key}
              userId={user.id}
              initialBestScores={bestScores}
            />
          ) : (
            <PronunciationTrail chapters={chapters} currentKey={current?.key ?? null} />
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
