import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ReviewSession from "@/components/review/ReviewSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { REVIEW_SESSION_SIZE } from "@/lib/srs";
import { VOCAB_TOPICS, getWordsForTopic, type VocabWordWithProgress } from "@/lib/vocabulary";

export default async function ReviewPage() {
  const tn = await getTranslations("nav");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/auth/login?next=/review");

  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: dueRows, error }, { count: learnedCount }] = await Promise.all([
    supabase.from("profiles").select("display_name, streak_days, avatar_url").eq("id", user.id).single(),
    supabase
      .from("vocabulary_progress")
      .select("*")
      .eq("user_id", user.id)
      .lte("next_review_at", nowIso)
      .order("next_review_at", { ascending: true })
      .limit(REVIEW_SESSION_SIZE),
    // Everything learned so far, for the empty state.
    supabase.from("vocabulary_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  // Pre-0022 the next_review_at column doesn't exist yet.
  const migrationMissing = error?.code === "42703";
  let nextDue: string | null = null;
  if (!migrationMissing && (dueRows ?? []).length === 0) {
    const { data: upcoming } = await supabase
      .from("vocabulary_progress")
      .select("next_review_at")
      .eq("user_id", user.id)
      .gt("next_review_at", nowIso)
      .order("next_review_at", { ascending: true })
      .limit(1);
    nextDue = upcoming?.[0]?.next_review_at ?? null;
  }

  // Resolve due keys back to static word data.
  const wordByKey = new Map(
    VOCAB_TOPICS.filter((t) => t.available).flatMap((t) =>
      getWordsForTopic(t.key).map((w) => [w.key, w] as const)
    )
  );
  const dueWords: VocabWordWithProgress[] = (dueRows ?? []).flatMap((row) => {
    const word = wordByKey.get(row.word_key);
    if (!word) return [];
    return [
      {
        ...word,
        correct_count: row.correct_count ?? 0,
        incorrect_count: row.incorrect_count ?? 0,
        last_reviewed_at: row.last_reviewed_at ?? null,
        box: row.box ?? 1,
      },
    ];
  });

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
            <b className="text-charcoal font-semibold">Practice</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-sky)] text-sky-deep border border-sky-line items-center justify-center text-[15px] mr-[9px]">
                💧
              </span>
              {tn("practice")}
              <span className="ml-2 text-[13px] font-medium text-faint">review time</span>
            </h1>
            <span className="flex items-center gap-3 flex-wrap text-[13px] text-muted">
              <Link href="/review/words" className="font-semibold text-sky-deep hover:underline">
                📚 {tn("myWords")} →
              </Link>
            </span>
          </div>

          {migrationMissing ? (
            <div className="max-w-[560px] border border-[var(--tint-slate-line)] rounded-[14px] bg-[var(--tint-slate)] p-[18px]">
              <b className="block font-semibold text-[14px] mb-1">Practice opens soon</b>
              <small className="block text-[13px] text-muted leading-[1.55]">
                Run the included migration{" "}
                <code className="text-[12px]">supabase/migrations/0022_srs_review.sql</code> to turn
                on spaced-repetition review.
              </small>
            </div>
          ) : dueWords.length > 0 ? (
            <ReviewSession words={dueWords} userId={user.id} />
          ) : (
            <div className="max-w-[560px] border border-line rounded-[14px] p-[clamp(24px,4vw,32px)] text-center">
              <p className="text-4xl mb-2">🌿</p>
              <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">
                Nothing to review right now
              </h2>
              <p className="text-sm text-muted mb-5">
                {(learnedCount ?? 0) > 0 ? (
                  <>
                    All {learnedCount} learned words are still fresh.
                    {nextDue &&
                      ` The next one is due ${new Date(nextDue).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}.`}
                  </>
                ) : (
                  <>Learn a few words first — they&apos;ll show up here when it&apos;s time to review them.</>
                )}
              </p>
              <Link
                href="/vocabulary"
                className="inline-flex items-center justify-center rounded-[9px] bg-success px-[22px] py-2.5 text-sm font-semibold text-white hover:bg-success-deep transition-colors"
              >
                Plant new words →
              </Link>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
