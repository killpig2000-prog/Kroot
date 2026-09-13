import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LessonBar from "@/components/ui/LessonBar";
import WordDetailCard from "@/components/vocabulary/WordDetailCard";
import WordDeck, { type DeckWord } from "@/components/vocabulary/WordDeck";
import GuidedStep from "@/components/onboarding/GuidedStep";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { VOCAB_TOPICS } from "@/lib/vocabulary";
import { getChaptersForTopic } from "@/lib/vocabulary-words";
import { findMoreExamples } from "@/lib/vocab-examples";
import { DEFAULT_WORD_BANK_SLOTS, countSavedWords } from "@/lib/word-bank";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

// A Day's words as one side-scrolling deck (WordDeck), opened on word `i`.
// Looked up from a reading passage it's the single word instead — the
// chapter's word order has nothing to do with the story the learner left.
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
  const tn = await getTranslations("nav");

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

  // One query for the whole Day — the deck shows all ten cards at once.
  const dayKeys = chapterWords.map((w) => w.key);
  const progressQuery = (cols: string) =>
    supabase.from("vocabulary_progress").select(cols).eq("user_id", user.id).in("word_key", dayKeys);

  // Migration 0039 columns — tolerant of a checkout whose DB is behind.
  const [first, savedCount, slotsRes] = await Promise.all([
    progressQuery("word_key, correct_count, incorrect_count, box, saved"),
    countSavedWords(supabase, user.id),
    supabase.from("profiles").select("word_bank_slots").eq("id", user.id).maybeSingle(),
  ]);
  type ProgressRow = {
    word_key: string;
    correct_count: number | null;
    incorrect_count: number | null;
    box: number | null;
    saved?: boolean | null;
  };
  let rows = (first.data ?? []) as unknown as ProgressRow[];
  if (first.error?.code === "42703") {
    const fallback = await progressQuery("word_key, correct_count, incorrect_count, box");
    rows = (fallback.data ?? []) as unknown as ProgressRow[];
  }
  const byKey = new Map(rows.map((r) => [r.word_key, r]));
  const slots = slotsRes.error
    ? DEFAULT_WORD_BANK_SLOTS
    : ((slotsRes.data as { word_bank_slots?: number | null } | null)?.word_bank_slots ??
      DEFAULT_WORD_BANK_SLOTS);

  const deck: DeckWord[] = chapterWords.map((w) => {
    const p = byKey.get(w.key);
    return {
      word: {
        key: w.key,
        korean: w.korean,
        romanization: w.romanization,
        meaning_en: w.meaning_en,
        example_kr: w.example_kr,
        example_en: w.example_en,
        moreExamples: findMoreExamples(w.korean, w.example_kr, 1),
      },
      correctCount: p?.correct_count ?? 0,
      incorrectCount: p?.incorrect_count ?? 0,
      box: p?.box ?? 1,
      inBank: p?.saved ?? false,
    };
  });

  const fromBank = sp.from === "bank";
  // Only ever an in-app path: an absolute or protocol-relative URL here would
  // turn a word link into an open redirect.
  const backTo =
    sp.from === "reading" && sp.back?.startsWith("/") && !sp.back.startsWith("//")
      ? sp.back
      : null;
  const unitHref = `/vocabulary?level=${level}&unit=${chapterIndex}`;

  // A single looked-up word still pays the Day out when it's the last one
  // left, so it needs the other nine's state.
  const current = deck[wordIndex];
  const others = deck.filter((_, k) => k !== wordIndex);
  const othersMarked = others.filter((d) => d.correctCount + d.incorrectCount > 0).length;
  const othersGotIt = others.filter((d) => d.box > 1).length;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? ""}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
          lessonBar
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px] min-h-dvh flex flex-col">
          {/* "Vocabulary / Day N", ← to the chapter (or where you came from) */}
          <LessonBar
            href="/vocabulary"
            title={tn("vocabulary")}
            sub={tv("dayN", { n: chapterIndex + 1 })}
            backHref={backTo ?? (fromBank ? "/review/words" : unitHref)}
            locale={locale}
          />
          <GuidedStep step="word-read" />
          <GuidedStep step="word-goti" />
          <GuidedStep step="word-bank" />
          {/* the card box centres in whatever room is left under the lesson
              bar (2026-09-11, user call) — a short card no longer sits
              pinned to the top with empty page below it; a card taller
              than the screen just grows this block and scrolls as before */}
          <div className="flex-1 flex flex-col justify-center">
          {backTo ? (
            <WordDetailCard
              word={current.word}
              locale={locale}
              userId={user.id}
              correctCount={current.correctCount}
              incorrectCount={current.incorrectCount}
              box={current.box}
              level={level}
              inBank={current.inBank}
              savedCount={savedCount}
              slots={slots}
              topicKey={topicKey}
              dayIndex={chapterIndex}
              dayTotal={chapterWords.length}
              othersMarked={othersMarked}
              othersGotIt={othersGotIt}
              hasNextDay={chapterIndex + 1 < chapters.length}
            />
          ) : (
            <WordDeck
              // Remount per Day: the deck's answered/bank state is the Day's.
              key={`${level}-${chapterIndex}`}
              words={deck}
              startIndex={wordIndex}
              locale={locale}
              userId={user.id}
              level={level}
              savedCount={savedCount}
              slots={slots}
              unitHref={unitHref}
              topicKey={topicKey}
              dayIndex={chapterIndex}
              hasNextDay={chapterIndex + 1 < chapters.length}
            />
          )}

          {/* Shop moved off the global nav into My room (2026-09-07
              restructure); this page's own quick link is the guided tour's
              shop-nav target — the next step after "add to bank" only
              actually navigates once the learner clicks it. It sits at the
              foot of the page rather than above the word (2026-09-08): a
              screen for memorising a word shouldn't open with a door out of
              it. Same target, same step. */}
          <GuidedStep step="shop-nav" />
          <div className="mt-5 text-right">
            <Link
              href="/shop"
              data-tour="guided-nav-shop"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-muted hover:text-success transition-colors"
            >
              🛍️ {tn("shop")} →
            </Link>
          </div>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
