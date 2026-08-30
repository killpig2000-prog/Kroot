import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WordBankList, { type BankItem } from "@/components/vocabulary/WordBankList";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { VOCAB_TOPICS, getWordsForTopic } from "@/lib/vocabulary";
import { PUBLIC_VOCAB_WORDS } from "@/lib/vocab-slugs";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";

// "My words" — the word bank. One flat list of everything the learner has
// collected, newest activity first. No stage buckets, no filter tabs: the
// learner asked to see all of it at once, open a word, and delete.

type ProgressRow = {
  word_key: string;
  correct_count: number | null;
  incorrect_count: number | null;
  last_reviewed_at: string | null;
  created_at: string | null;
  box?: number | null;
  next_review_at?: string | null;
};

export default async function MyWordsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tn = await getTranslations("nav");
  const tv = await getTranslations("vocabulary");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/auth/login?next=/review/words");

  const bank = () =>
    supabase
      .from("vocabulary_progress")
      .select("word_key, correct_count, incorrect_count, last_reviewed_at, created_at, box, next_review_at")
      .eq("user_id", user.id)
      .order("last_reviewed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

  const [{ data: profile }, first] = await Promise.all([
    supabase.from("profiles").select("display_name, streak_days, avatar_url").eq("id", user.id).single(),
    bank(),
  ]);

  // Pre-0022 checkouts don't have box / next_review_at; fall back rather than
  // blanking the whole page.
  let rows = (first.data ?? []) as ProgressRow[];
  if (first.error?.code === "42703") {
    const { data } = await supabase
      .from("vocabulary_progress")
      .select("word_key, correct_count, incorrect_count, last_reviewed_at, created_at")
      .eq("user_id", user.id)
      .order("last_reviewed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    rows = (data ?? []) as ProgressRow[];
  }

  const wordByKey = new Map(
    VOCAB_TOPICS.filter((t) => t.available).flatMap((t) =>
      getWordsForTopic(t.key).map((w) => [w.key, w] as const)
    )
  );
  // Korean surface form → public dictionary slug, so a row can open its
  // /words page. Words outside the daily-life deck simply have no slug.
  const slugByKorean = new Map<string, string>();
  for (const w of PUBLIC_VOCAB_WORDS) {
    if (!slugByKorean.has(w.korean)) slugByKorean.set(w.korean, w.slug);
  }

  const items: BankItem[] = rows.map((r) => {
    const w = wordByKey.get(r.word_key);
    // word_key is "topic:level:korean" — a row whose deck entry moved still
    // shows its Korean rather than disappearing from the bank.
    const korean = w?.korean ?? r.word_key.split(":").slice(2).join(":") ?? r.word_key;
    return {
      wordKey: r.word_key,
      korean,
      romanization: w?.romanization ?? "",
      meaning: w ? getLocalizedMeaning(w, locale) : "",
      slug: slugByKorean.get(korean) ?? null,
      incorrectCount: r.incorrect_count ?? 0,
      correctCount: r.correct_count ?? 0,
      lastReviewedAt: r.last_reviewed_at ?? null,
      box: r.box ?? null,
      nextReviewAt: r.next_review_at ?? null,
    };
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
          <div className="flex items-baseline gap-3 flex-wrap mb-4">
            <h1 className="font-bold text-[22px] tracking-[-0.02em]">{tn("myWords")}</h1>
            {items.length > 0 && (
              <span className="text-[13px] text-muted">{tv("bank.count", { count: items.length })}</span>
            )}
          </div>

          <WordBankList userId={user.id} items={items} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
