import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ReviewSession from "@/components/review/ReviewSession";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { MAX_REVIEW_CAPACITY_BONUS, REVIEW_SESSION_SIZE, dailyReviewCap } from "@/lib/srs";
import { VOCAB_TOPICS, type VocabWordWithProgress } from "@/lib/vocabulary";
import { getWordsForTopic } from "@/lib/vocabulary-words";
import { ATTEMPTED_FILTER } from "@/lib/word-bank";

type DueRow = {
  word_key: string;
  correct_count: number | null;
  incorrect_count: number | null;
  last_reviewed_at: string | null;
  box: number | null;
};

/**
 * One session's worth of due words, drawn from both ends of the queue.
 *
 * Strict oldest-first meant a backlog larger than the daily cap never reached
 * the recently-due words — which, since a word's first correct answer now
 * lands it in box 1, are yesterday's brand-new words with the shortest memory
 * of all. Alternating between the longest-overdue and the most-recently-due
 * gives the debt priority without ever starving the fresh end, and the result
 * is shuffled so the session doesn't read as two sorted halves.
 *
 * Runs on the server, once per request: the picked words are serialised into
 * the client component's props, so the shuffle can't desync hydration.
 */
function mixDue(oldest: DueRow[], newest: DueRow[], cap: number): DueRow[] {
  const picked = new Map<string, DueRow>();
  for (let i = 0; i < Math.max(oldest.length, newest.length) && picked.size < cap; i++) {
    for (const row of [oldest[i], newest[i]]) {
      if (row && !picked.has(row.word_key) && picked.size < cap) picked.set(row.word_key, row);
    }
  }
  const rows = [...picked.values()];
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

export default async function ReviewPage() {
  const tn = await getTranslations("nav");
  const t = await getTranslations("vocabulary.practice");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/auth/login?next=/review");

  // Review is REVIEW_SESSION_SIZE (10) words a day, everywhere in the app —
  // no picker. A learner can raise that by buying capacity (0056,
  // buy_review_capacity, +5/purchase) from the Words to review card on
  // /profile; dailyReviewCap folds that bonus in.
  const nowIso = new Date().toISOString();
  const todayStartIso = `${nowIso.slice(0, 10)}T00:00:00.000Z`;
  const [
    { data: profile },
    { data: oldestDue, error },
    { data: newestDue },
    { count: learnedCount },
    { count: reviewedTodayCount },
  ] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, streak_days, avatar_url, review_capacity_bonus")
        .eq("id", user.id)
        .single(),
      // Two windows over the due queue, mixed below. Ordering by next_review_at
      // alone meant a backlog bigger than the daily cap buried every recently
      // due word behind older debt — and the newest ones are exactly yesterday's
      // first-time words, whose 1-day check-in is the point of box 1. Each
      // window is fetched up to the maximum possible cap (base + max
      // purchasable bonus) and sliced to this account's real cap once the
      // profile row is in.
      // The word bank plants a row the moment a word is bookmarked, unrelated
      // to actually studying it (see plantWord/saveToBank) — the ATTEMPTED
      // filter keeps a merely-bookmarked word out of the SRS queue until the
      // learner has really answered it at least once.
      supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_review_at", nowIso)
        .or(ATTEMPTED_FILTER)
        .order("next_review_at", { ascending: true })
        .limit(REVIEW_SESSION_SIZE + MAX_REVIEW_CAPACITY_BONUS),
      supabase
        .from("vocabulary_progress")
        .select("*")
        .eq("user_id", user.id)
        .lte("next_review_at", nowIso)
        .or(ATTEMPTED_FILTER)
        .order("next_review_at", { ascending: false })
        .limit(REVIEW_SESSION_SIZE + MAX_REVIEW_CAPACITY_BONUS),
      // Everything learned so far, for the empty state — attempted only, so a
      // learner who has merely bookmarked words isn't told they've "learned"
      // them and are all caught up. They haven't studied any yet.
      supabase
        .from("vocabulary_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .or(ATTEMPTED_FILTER),
      // Words already reviewed today — once this hits REVIEW_SESSION_SIZE,
      // review is done for the day even if the backlog isn't empty. User:
      // clearing one 10-word batch shouldn't immediately surface the next
      // 10 of a much larger backlog — that's a slog, not "done for today".
      supabase
        .from("vocabulary_progress")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("last_reviewed_at", todayStartIso),
    ]);

  const cap = dailyReviewCap(profile?.review_capacity_bonus ?? 0);
  const doneForToday = (reviewedTodayCount ?? 0) >= cap;

  // Pre-0022 the next_review_at column doesn't exist yet.
  const migrationMissing = error?.code === "42703";
  // Any other failure used to fall through to the 🌿 "nothing to review" card,
  // telling a learner with a real backlog that they were all caught up.
  const loadFailed = !!error && !migrationMissing;
  let nextDue: string | null = null;
  if (!migrationMissing && (oldestDue ?? []).length === 0) {
    const { data: upcoming } = await supabase
      .from("vocabulary_progress")
      .select("next_review_at")
      .eq("user_id", user.id)
      .gt("next_review_at", nowIso)
      .or(ATTEMPTED_FILTER)
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
  // Always fill a session up to the full cap — not "cap minus whatever was
  // already reviewed today". A word just reviewed drops out of the due
  // query on its own (next_review_at moves forward), so there's no
  // duplicate risk; doneForToday (below) is what actually stops the day
  // once reviewedTodayCount reaches cap. User: "10개로 하면 복습은 10개로
  // 채워져야하는데 지금 8개로 채워지고있어".
  const dueWords: VocabWordWithProgress[] = doneForToday
    ? []
    : mixDue(oldestDue ?? [], newestDue ?? [], cap).flatMap((row) => {
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

  // Wrong answers for the quiz. Without this the options came only from the
  // session itself, so a learner with two words due got a two-option quiz.
  // Bug found live: a review session almost always spans several CEFR
  // levels (SRS due dates don't care what level a word is), but
  // wordByKey.values() lists words grouped by level — a flat slice(0, 120)
  // over the whole due-levels set could land entirely inside one level
  // (A2 alone has 433 words), leaving zero candidates for every other level
  // and collapsing those words' quizzes to a single "option" (the answer,
  // alone). Per-level capping guarantees every due level gets its own share.
  const dueKeys = new Set(dueWords.map((w) => w.key));
  const dueLevels = new Set(dueWords.map((w) => w.level));
  const PER_LEVEL_CAP = 30;
  const distractorPool = [...dueLevels].flatMap((lvl) =>
    [...wordByKey.values()]
      .filter((w) => w.level === lvl && !dueKeys.has(w.key))
      .slice(0, PER_LEVEL_CAP)
  );

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
            <b className="text-charcoal font-semibold">{tn("review")}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-sky)] text-sky-deep border border-sky-line items-center justify-center text-[15px] mr-[9px]">
                💧
              </span>
              {tn("review")}
              <span className="ml-2 text-[13px] font-medium text-faint">{t("reviewTime")}</span>
            </h1>
            <span className="flex items-center gap-3 flex-wrap text-[13px] text-muted">
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
          ) : loadFailed ? (
            <div className="max-w-[560px] border border-line bg-danger-bg rounded-[14px] p-[18px]">
              <b className="block font-semibold text-[14px] mb-1">{t("loadFailedTitle")}</b>
              <small className="block text-[13px] text-muted leading-[1.55]">
                {t("loadFailedBody")}
              </small>
            </div>
          ) : doneForToday ? (
            <div className="max-w-[560px] border border-line rounded-[14px] p-[clamp(24px,4vw,32px)] text-center">
              <p className="text-4xl mb-2">✅</p>
              <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">
                {t("doneTodayTitle")}
              </h2>
              <p className="text-sm text-muted">
                {t("doneTodayBody", { count: cap })}
              </p>
            </div>
          ) : dueWords.length > 0 ? (
            <ReviewSession words={dueWords} pool={distractorPool} userId={user.id} />
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
