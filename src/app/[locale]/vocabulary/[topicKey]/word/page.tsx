import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WordDetailCard from "@/components/vocabulary/WordDetailCard";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { VOCAB_TOPICS } from "@/lib/vocabulary";
import { getChaptersForTopic } from "@/lib/vocabulary-words";
import { findMoreExamples } from "@/lib/vocab-examples";
import { DEFAULT_WORD_BANK_SLOTS, countSavedWords } from "@/lib/word-bank";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

// A single word looked up from the unit preview — a dictionary entry, not a
// quiz step. Reuses the session route's chapter/level addressing so prev/next
// links stay simple integer math instead of encoding word keys.
export default async function VocabWordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; topicKey: string }>;
  searchParams: Promise<{
    level?: string;
    chapter?: string;
    i?: string;
    from?: string;
    back?: string;
  }>;
}) {
  const { locale, topicKey } = await params;
  const sp = await searchParams;
  const topic = VOCAB_TOPICS.find((t) => t.key === topicKey && t.available);
  if (!topic) notFound();

  const tv = await getTranslations("vocabulary");

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const profile = await getDashboardProfile(supabase, user.id);
  const level = (isCefrLevel(sp.level) ? sp.level : profile?.current_level ?? "A1") as CefrLevel;

  const chapters = getChaptersForTopic(topicKey, level);
  const chapterIndex = Number(sp.chapter ?? 0);
  const chapterWords = chapters[chapterIndex];
  if (!chapterWords) notFound();

  const wordIndex = Number(sp.i ?? 0);
  const word = chapterWords[wordIndex];
  if (!word) notFound();

  const progressQuery = (cols: string) =>
    supabase
      .from("vocabulary_progress")
      .select(cols)
      .eq("user_id", user.id)
      .eq("word_key", word.key)
      .maybeSingle();

  // Migration 0039 columns — tolerant of a checkout whose DB is behind.
  const [first, savedCount, slotsRes] = await Promise.all([
    progressQuery("correct_count, incorrect_count, box, saved"),
    countSavedWords(supabase, user.id),
    supabase.from("profiles").select("word_bank_slots").eq("id", user.id).maybeSingle(),
  ]);
  type ProgressRow = {
    correct_count: number | null;
    incorrect_count: number | null;
    box: number | null;
    saved?: boolean | null;
  };
  let progress = first.data as unknown as ProgressRow | null;
  if (first.error?.code === "42703") {
    const fallback = await progressQuery("correct_count, incorrect_count, box");
    progress = fallback.data as unknown as ProgressRow | null;
  }
  const slots = slotsRes.error
    ? DEFAULT_WORD_BANK_SLOTS
    : ((slotsRes.data as { word_bank_slots?: number | null } | null)?.word_bank_slots ??
      DEFAULT_WORD_BANK_SLOTS);

  // How far this Day already is, so the card can tell when marking *this*
  // word is what finishes it — that transition is what pays the Day out.
  // Counted over the other nine words only; the current word's own state is
  // whatever the learner is about to change it to.
  const otherKeys = chapterWords.filter((w) => w.key !== word.key).map((w) => w.key);
  const dayQuery = (cols: string) =>
    supabase
      .from("vocabulary_progress")
      .select(cols)
      .eq("user_id", user.id)
      .in("word_key", otherKeys);
  // `box` needs migration 0022 — a checkout whose DB is behind still counts
  // marks, it just can't tell "got it" from "still learning" for the score.
  let dayRows = (await dayQuery("correct_count, incorrect_count, box")) as {
    data: { correct_count: number | null; incorrect_count: number | null; box?: number | null }[] | null;
    error: { code?: string } | null;
  };
  if (dayRows.error?.code === "42703") {
    dayRows = (await dayQuery("correct_count, incorrect_count")) as typeof dayRows;
  }
  const others = dayRows.data ?? [];
  const othersMarked = others.filter(
    (r) => (r.correct_count ?? 0) + (r.incorrect_count ?? 0) > 0
  ).length;
  const othersGotIt = others.filter((r) => (r.box ?? 1) > 1).length;

  const moreExamples = findMoreExamples(word.korean, word.example_kr);

  // "&from=..." survives prev/next, so stepping through words keeps the way
  // back to wherever the learner came from — the word bank, or the line of a
  // reading passage that sent them here.
  const fromBank = sp.from === "bank";
  // Only ever an in-app path: an absolute or protocol-relative URL here would
  // turn a word link into an open redirect.
  const backTo =
    sp.from === "reading" && sp.back?.startsWith("/") && !sp.back.startsWith("//")
      ? sp.back
      : null;
  const carry = fromBank
    ? "&from=bank"
    : backTo
    ? `&from=reading&back=${encodeURIComponent(backTo)}`
    : "";
  const wordHref = (chapter: number, i: number) =>
    `/vocabulary/${topicKey}/word?level=${level}&chapter=${chapter}&i=${i}${carry}`;

  // Prev/next stay inside the unit: the first word's "Prev" and the last
  // word's "Next" both return to the unit page instead of quietly stepping
  // into a neighbouring unit under a different title. Looked up from a
  // reading passage, though, the chapter's word order has nothing to do
  // with the story the learner just left — so there's nothing to step to.
  const unitHref = `/vocabulary?level=${level}&unit=${chapterIndex}`;
  const prevHref = !backTo && wordIndex > 0 ? wordHref(chapterIndex, wordIndex - 1) : null;
  const nextHref = !backTo && wordIndex < chapterWords.length - 1 ? wordHref(chapterIndex, wordIndex + 1) : null;

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
          <GuidedStep step="word-goti" />
          <GuidedStep step="word-bank" />
          {/* Shop is spotlit in the Sidebar without leaving this page — the
              next step after "add to bank" only actually navigates once the
              learner clicks it. */}
          <GuidedStep step="shop-nav" />

          <WordDetailCard
            // Remount per word: without a key the card keeps its "saving"
            // state across the search-param navigation and the next word's
            // buttons arrive already disabled.
            key={word.key}
            word={{
              key: word.key,
              korean: word.korean,
              romanization: word.romanization,
              meaning_en: word.meaning_en,
              example_kr: word.example_kr,
              example_en: word.example_en,
              moreExamples,
            }}
            locale={locale}
            userId={user.id}
            correctCount={progress?.correct_count ?? 0}
            incorrectCount={progress?.incorrect_count ?? 0}
            box={progress?.box ?? 1}
            topicLabel={topic.label}
            level={level}
            prevHref={prevHref}
            nextHref={nextHref}
            inBank={progress?.saved ?? false}
            savedCount={savedCount}
            slots={slots}
            fromBank={fromBank}
            backHref={backTo}
            backLabel={tv("detail.backToStory")}
            unitHref={unitHref}
            unitLabel={tv("unitN", { n: chapterIndex + 1 })}
            topicKey={topicKey}
            dayIndex={chapterIndex}
            dayTotal={chapterWords.length}
            othersMarked={othersMarked}
            othersGotIt={othersGotIt}
            hasNextDay={chapterIndex + 1 < chapters.length}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
