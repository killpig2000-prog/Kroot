import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import ForgetWordButton from "@/components/words/ForgetWordButton";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { MAX_BOX } from "@/lib/srs";
import { VOCAB_TOPICS, getWordsForTopic, type VocabWordWithProgress } from "@/lib/vocabulary";

// "My words": everything the learner has planted — from vocabulary sessions
// or tap-to-save in listening/reading/grammar — grouped by Leitner box.
const BOX_META: { label: string; icon: string; blurb: string }[] = [
  { label: "Just planted", icon: "🌱", blurb: "reviewed tomorrow" },
  { label: "Sprouting", icon: "🌿", blurb: "every 3 days" },
  { label: "Taking root", icon: "🪴", blurb: "every week" },
  { label: "Growing strong", icon: "🌳", blurb: "every 2 weeks" },
  { label: "Deep roots", icon: "🌲", blurb: "every 5 weeks" },
];

type Row = VocabWordWithProgress & { next_review_at: string | null };

function fmtDue(iso: string | null, now: number): { text: string; due: boolean } {
  if (!iso) return { text: "due now", due: true };
  const t = Date.parse(iso);
  if (t <= now) return { text: "due now", due: true };
  const days = Math.ceil((t - now) / 86_400_000);
  if (days <= 1) return { text: "tomorrow", due: false };
  return {
    text: new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    due: false,
  };
}

export default async function MyWordsPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/auth/login?next=/review/words");

  const [{ data: profile }, { data: rows, error }] = await Promise.all([
    supabase.from("profiles").select("display_name, streak_days, avatar_url").eq("id", user.id).single(),
    supabase
      .from("vocabulary_progress")
      .select("word_key, correct_count, incorrect_count, last_reviewed_at, box, next_review_at")
      .eq("user_id", user.id)
      .order("next_review_at", { ascending: true }),
  ]);

  // Pre-0022 the box / next_review_at columns don't exist yet.
  const migrationMissing = error?.code === "42703";

  const wordByKey = new Map(
    VOCAB_TOPICS.filter((t) => t.available).flatMap((t) =>
      getWordsForTopic(t.key).map((w) => [w.key, w] as const)
    )
  );
  const words: Row[] = (rows ?? []).flatMap((r) => {
    const w = wordByKey.get(r.word_key);
    if (!w) return [];
    return [
      {
        ...w,
        correct_count: r.correct_count ?? 0,
        incorrect_count: r.incorrect_count ?? 0,
        last_reviewed_at: r.last_reviewed_at ?? null,
        box: r.box ?? 1,
        next_review_at: r.next_review_at ?? null,
      },
    ];
  });

  const now = Date.parse(new Date().toISOString());
  const dueCount = words.filter((w) => !w.next_review_at || Date.parse(w.next_review_at) <= now).length;
  const mastered = words.filter((w) => (w.box ?? 1) >= MAX_BOX).length;
  const byBox = Array.from({ length: MAX_BOX }, (_, i) =>
    words.filter((w) => Math.min(Math.max(w.box ?? 1, 1), MAX_BOX) === i + 1)
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
              Garden
            </Link>
            <span>/</span>
            <Link href="/review" className="hover:text-charcoal transition-colors">
              Practice
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">My words</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#EFF6FF] text-sky-deep border border-sky-line items-center justify-center text-[15px] mr-[9px]">
                📚
              </span>
              My words
            </h1>
            <span className="text-[13px] text-muted">
              Tap any Korean word in a lesson to plant it here.
            </span>
          </div>

          {/* stats */}
          <div className="flex gap-2.5 flex-wrap mb-6">
            {[
              { label: "words", value: words.length },
              { label: "due now", value: dueCount, accent: dueCount > 0 },
              { label: "deep roots", value: mastered },
            ].map((s) => (
              <span
                key={s.label}
                className={`inline-flex items-baseline gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] ${
                  s.accent ? "border-sky-line bg-[#EFF6FF] text-[#1D4ED8]" : "border-line bg-cream text-muted"
                }`}
              >
                <b className="font-bold text-[15px] text-charcoal">{s.value}</b> {s.label}
              </span>
            ))}
            {dueCount > 0 && (
              <Link
                href="/review"
                className="inline-flex items-center rounded-full bg-success px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-success-deep transition-colors"
              >
                💧 Water {dueCount} now →
              </Link>
            )}
          </div>

          {migrationMissing ? (
            <div className="max-w-[560px] border border-[#CBD5E1] rounded-[14px] bg-[#F1F5F9] p-[18px]">
              <b className="block font-semibold text-[14px] mb-1">My words opens soon</b>
              <small className="block text-[13px] text-muted leading-[1.55]">
                Run the included migration{" "}
                <code className="text-[12px]">supabase/migrations/0022_srs_review.sql</code> to turn on the word bank.
              </small>
            </div>
          ) : words.length === 0 ? (
            <div className="max-w-[560px] border border-line rounded-[14px] p-[clamp(24px,4vw,32px)] text-center">
              <p className="text-4xl mb-2">🌱</p>
              <h2 className="font-bold text-[19px] tracking-[-0.02em] mb-1.5">Nothing planted yet</h2>
              <p className="text-sm text-muted mb-5">
                Learn a vocabulary chapter, or tap a word while listening or reading, and it&apos;ll show up here.
              </p>
              <Link
                href="/vocabulary"
                className="inline-flex items-center justify-center rounded-[9px] bg-success px-[22px] py-2.5 text-sm font-semibold text-white hover:bg-success-deep transition-colors"
              >
                Plant new words →
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 max-w-[760px]">
              {byBox.map((group, i) => {
                const meta = BOX_META[i];
                return (
                  <section key={i} className="border border-line rounded-[14px] bg-cream overflow-hidden">
                    <header className="flex items-baseline justify-between gap-3 px-[18px] py-3 bg-warm border-b border-line">
                      <b className="font-semibold text-[14px]">
                        {meta.icon} {meta.label}
                        <span className="ml-2 text-[12px] font-medium text-faint">{meta.blurb}</span>
                      </b>
                      <small className="text-[12.5px] text-muted">{group.length}</small>
                    </header>
                    {group.length === 0 ? (
                      <p className="px-[18px] py-3 text-[13px] text-faint">No words here yet.</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {group.map((w) => {
                          const due = fmtDue(w.next_review_at, now);
                          return (
                            <li key={w.key} className="flex items-center gap-3 px-[18px] py-2.5">
                              <span className="flex-none text-[10.5px] font-bold rounded-md px-1.5 py-px bg-warm-2 border border-line text-muted">
                                {w.level}
                              </span>
                              <span className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                                <b className="kr font-semibold text-[15px]">{w.korean}</b>
                                <i className="text-[12px] text-faint not-italic">{w.romanization}</i>
                                <span className="text-[13px] text-muted truncate">{w.meaning_en}</span>
                              </span>
                              <span
                                className={`flex-none text-[11.5px] font-semibold ${
                                  due.due ? "text-[#1D4ED8]" : "text-faint"
                                }`}
                              >
                                {due.due ? "💧 " : ""}
                                {due.text}
                              </span>
                              <ForgetWordButton userId={user.id} wordKey={w.key} />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
