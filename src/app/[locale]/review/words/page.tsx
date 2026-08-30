import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WordBankList, { type BankItem } from "@/components/vocabulary/WordBankList";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { VOCAB_TOPICS, getChaptersForTopic, getWordsForTopic, type VocabWord } from "@/lib/vocabulary";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";
import { DEFAULT_WORD_BANK_SLOTS } from "@/lib/word-bank";
import { isCefrLevel } from "@/lib/tree";

// "My words" — the word bank. Not everything the learner has ever studied:
// a hand-picked shortlist with a capacity (profiles.word_bank_slots), so the
// list stays short enough to actually be re-read.

type ProgressRow = {
  word_key: string;
  correct_count: number | null;
  incorrect_count: number | null;
  last_reviewed_at: string | null;
  created_at: string | null;
  box?: number | null;
  next_review_at?: string | null;
};

const SELECT = "word_key, correct_count, incorrect_count, last_reviewed_at, created_at, box, next_review_at";

export default async function MyWordsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const tn = await getTranslations("nav");
  const tv = await getTranslations("vocabulary");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/auth/login?next=/review/words");

  const bank = (cols: string, savedOnly: boolean) => {
    let q = supabase.from("vocabulary_progress").select(cols).eq("user_id", user.id);
    if (savedOnly) q = q.eq("saved", true);
    return q
      .order("last_reviewed_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
  };

  const [{ data: profile }, slotsRes, first] = await Promise.all([
    supabase.from("profiles").select("display_name, streak_days, avatar_url").eq("id", user.id).single(),
    supabase.from("profiles").select("word_bank_slots").eq("id", user.id).maybeSingle(),
    bank(SELECT, true),
  ]);

  // Migration 0039 column — tolerant of a checkout whose DB is behind.
  const slots = slotsRes.error
    ? DEFAULT_WORD_BANK_SLOTS
    : ((slotsRes.data as { word_bank_slots?: number | null } | null)?.word_bank_slots ??
      DEFAULT_WORD_BANK_SLOTS);

  // Pre-0022 checkouts don't have box / next_review_at, pre-0039 ones no
  // `saved`; fall back rather than blanking the whole page.
  let rows = (first.data ?? []) as unknown as ProgressRow[];
  if (first.error?.code === "42703") {
    const { data } = await bank(
      "word_key, correct_count, incorrect_count, last_reviewed_at, created_at",
      false
    );
    rows = (data ?? []) as unknown as ProgressRow[];
  }

  const wordByKey = new Map(
    VOCAB_TOPICS.filter((t) => t.available).flatMap((t) =>
      getWordsForTopic(t.key).map((w) => [w.key, w] as const)
    )
  );

  // A bank row opens the in-app vocabulary page, which is addressed
  // positionally (topic + level + chapter index + index in chapter) — so the
  // position is resolved here, once per (topic, level) deck.
  const chapterCache = new Map<string, VocabWord[][]>();
  function vocabHref(wordKey: string): string | null {
    const [topicKey, level] = wordKey.split(":");
    if (!topicKey || !isCefrLevel(level)) return null;
    if (!VOCAB_TOPICS.some((t) => t.key === topicKey && t.available)) return null;
    const cacheKey = `${topicKey}:${level}`;
    let chapters = chapterCache.get(cacheKey);
    if (!chapters) {
      chapters = getChaptersForTopic(topicKey, level);
      chapterCache.set(cacheKey, chapters);
    }
    for (let c = 0; c < chapters.length; c++) {
      const i = chapters[c].findIndex((w) => w.key === wordKey);
      if (i >= 0) return `/vocabulary/${topicKey}/word?level=${level}&chapter=${c}&i=${i}&from=bank`;
    }
    return null;
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
      href: vocabHref(r.word_key),
      incorrectCount: r.incorrect_count ?? 0,
    };
  });

  const full = items.length >= slots;

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
          <div className="mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em]">{tn("myWords")}</h1>
            <span className="flex items-center gap-2">
              <span
                className={`text-[13px] font-semibold tabular-nums ${full ? "text-amber" : "text-muted"}`}
              >
                {tv("bank.budget", { used: items.length, slots })}
              </span>
              {/* One pip per slot — the capacity reads as countable cells, the
                  same unit the grid below is built from. Past ~30 slots the
                  pips get too fine to count, so it falls back to a bar. */}
              {slots <= 30 ? (
                <span
                  role="img"
                  aria-label={tv("bank.slotsAria", { used: items.length, slots })}
                  className="flex items-center gap-[3px]"
                >
                  {Array.from({ length: slots }, (_, i) => (
                    <span
                      key={i}
                      className={`block w-[7px] h-[12px] rounded-[2px] ${
                        i < items.length ? (full ? "bg-amber" : "bg-success") : "bg-line"
                      }`}
                    />
                  ))}
                </span>
              ) : (
                <span
                  role="img"
                  aria-label={tv("bank.slotsAria", { used: items.length, slots })}
                  className="block w-[64px] h-[6px] rounded-full bg-line overflow-hidden"
                >
                  <span
                    className={`block h-full rounded-full ${full ? "bg-amber" : "bg-success"}`}
                    style={{ width: `${Math.min(100, slots > 0 ? (items.length / slots) * 100 : 0)}%` }}
                  />
                </span>
              )}
            </span>
          </div>
          {full && <p className="text-[13px] text-muted mt-1.5">{tv("bank.fullHint", { slots })}</p>}
          </div>

          <WordBankList userId={user.id} items={items} slots={slots} />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
