import { notFound, redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import WordDetailCard from "@/components/vocabulary/WordDetailCard";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { VOCAB_TOPICS, getChaptersForTopic, getUnitTitle } from "@/lib/vocabulary";
import { findMoreExamples } from "@/lib/vocab-examples";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

// A single word looked up from the unit preview — a dictionary entry, not a
// quiz step. Reuses the session route's chapter/level addressing so prev/next
// links stay simple integer math instead of encoding word keys.
export default async function VocabWordPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicKey: string }>;
  searchParams: Promise<{ level?: string; chapter?: string; i?: string }>;
}) {
  const { topicKey } = await params;
  const sp = await searchParams;
  const topic = VOCAB_TOPICS.find((t) => t.key === topicKey && t.available);
  if (!topic) notFound();

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

  const { data: progress } = await supabase
    .from("vocabulary_progress")
    .select("correct_count, incorrect_count, box")
    .eq("user_id", user.id)
    .eq("word_key", word.key)
    .maybeSingle();

  const moreExamples = findMoreExamples(word.korean, word.example_kr);

  const wordHref = (chapter: number, i: number) =>
    `/vocabulary/${topicKey}/word?level=${level}&chapter=${chapter}&i=${i}`;

  const prevHref =
    wordIndex > 0
      ? wordHref(chapterIndex, wordIndex - 1)
      : chapterIndex > 0
      ? wordHref(chapterIndex - 1, chapters[chapterIndex - 1].length - 1)
      : null;
  const nextHref =
    wordIndex < chapterWords.length - 1
      ? wordHref(chapterIndex, wordIndex + 1)
      : chapterIndex < chapters.length - 1
      ? wordHref(chapterIndex + 1, 0)
      : null;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          <WordDetailCard
            word={{
              key: word.key,
              korean: word.korean,
              romanization: word.romanization,
              meaning_en: word.meaning_en,
              example_kr: word.example_kr,
              example_en: word.example_en,
              moreExamples,
            }}
            userId={user.id}
            correctCount={progress?.correct_count ?? 0}
            incorrectCount={progress?.incorrect_count ?? 0}
            box={progress?.box ?? 1}
            topicLabel={topic.label}
            level={level}
            prevHref={prevHref}
            nextHref={nextHref}
            unitHref={`/vocabulary?level=${level}&unit=${chapterIndex}`}
            unitLabel={getUnitTitle(level, chapterIndex)}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
