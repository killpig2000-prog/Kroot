import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ReviewSession from "@/components/review/ReviewSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { REVIEW_SESSION_SIZE, REVIEW_SESSION_SIZES, resolveReviewSize } from "@/lib/srs";
import { VOCAB_TOPICS, type VocabWordWithProgress } from "@/lib/vocabulary";
import { getWordsForTopic } from "@/lib/vocabulary-words";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ n?: string }>;
}) {
  const tn = await getTranslations("nav");
  const t = await getTranslations("vocabulary.practice");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/auth/login?next=/review");

  const sp = await searchParams;
  const sessionSize = resolveReviewSize(sp.n);

  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: dueRows, error }, { count: learnedCount }, { count: dueTotal }] =
    await Promise.all([
      supabase.from("profiles").select("display_name, streak_days, avatar_url").eq("id", user.id).single(),
      supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_review_at", nowIso)
        .order("next_review_at", { ascending: true })
        .limit(sessionSize),
      // Everything learned so far, for the empty state.
      supabase.from("vocabulary_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      // The real backlog, so the picker can offer only sizes that exist.
      supabase
        .from("vocabulary_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lte("next_review_at", nowIso),
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

  // Only offer a longer session when the backlog can actually fill it — the
  // default is always offered so a learner can get back to a short session.
  const backlog = dueTotal ?? 0;
  const sizeChoices = REVIEW_SESSION_SIZES.filter(
    (size) => size === REVIEW_SESSION_SIZE || size <= backlog
  );

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
              {tn("garden")}
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{tn("practice")}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-sky)] text-sky-deep border border-sky-line items-center justify-center text-[15px] mr-[9px]">
                💧
              </span>
              {tn("practice")}
              <span className="ml-2 text-[13px] font-medium text-faint">{t("reviewTime")}</span>
            </h1>
            <span className="flex items-center gap-3 flex-wrap text-[13px] text-muted">
              {sizeChoices.length > 1 && (
                <span className="flex items-center gap-1.5">
                  <span className="text-faint">{t("sessionLength")}</span>
                  <span className="inline-flex rounded-[9px] border border-line overflow-hidden">
                    {sizeChoices.map((size) => (
                      <Link
                        key={size}
                        href={size === REVIEW_SESSION_SIZE ? "/review" : `/review?n=${size}`}
                        aria-current={size === sessionSize ? "true" : undefined}
                        className={`px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                          size === sessionSize
                            ? "bg-success text-white"
                            : "bg-cream text-muted hover:bg-warm"
                        }`}
                      >
                        {size}
                      </Link>
                    ))}
                  </span>
                </span>
              )}
              <Link href="/review/words" className="font-semibold text-sky-deep hover:underline">
                📚 {tn("myWords")} →
              </Link>
            </span>
          </div>

          {migrationMissing ? (
            <div className="max-w-[560px] border border-[var(--tint-slate-line)] rounded-[14px] bg-[var(--tint-slate)] p-[18px]">
              <b className="block font-semibold text-[14px] mb-1">{t("opensSoonTitle")}</b>
              <small className="block text-[13px] text-muted leading-[1.55]">
                {t.rich("opensSoonBody", {
                  code: (chunks) => <code className="text-[12px]">{chunks}</code>,
                })}
              </small>
            </div>
          ) : dueWords.length > 0 ? (
            <ReviewSession words={dueWords} userId={user.id} />
          ) : (
            <div className="max-w-[560px] border border-line rounded-[14px] p-[clamp(24px,4vw,32px)] text-center">
              <p className="text-4xl mb-2">🌿</p>
              <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">
                {t("nothingTitle")}
              </h2>
              <p className="text-sm text-muted mb-5">
                {(learnedCount ?? 0) > 0 ? (
                  <>
                    {t("allFresh", { count: learnedCount ?? 0 })}
                    {nextDue && ` ${t("nextDue", { date: new Date(nextDue) })}`}
                  </>
                ) : (
                  <>{t("learnFirst")}</>
                )}
              </p>
              <Link
                href="/vocabulary"
                className="inline-flex items-center justify-center rounded-[9px] bg-success px-[22px] py-2.5 text-sm font-semibold text-white hover:bg-success-deep transition-colors"
              >
                {t("plantNew")}
              </Link>
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
