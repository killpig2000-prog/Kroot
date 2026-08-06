import { notFound, redirect } from "next/navigation";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { VOCAB_TOPICS, getChapterStatuses, getChaptersForTopic, unlockedVocabTiers } from "@/lib/vocabulary";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";

function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

// Like the reference design, picking a topic drops you straight into the cards —
// this route just finds where you left off and forwards you there.
export default async function VocabularyTopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicKey: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { topicKey } = await params;
  const topic = VOCAB_TOPICS.find((t) => t.key === topicKey && t.available);
  if (!topic) notFound();

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_level, xp")
    .eq("id", user.id)
    .single();

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const sp = await searchParams;

  const { data: progress } = await supabase
    .from("vocabulary_progress")
    .select("word_key, last_reviewed_at")
    .eq("user_id", user.id)
    .not("last_reviewed_at", "is", null);

  const reviewedKeys = new Set((progress ?? []).map((p) => p.word_key));
  const unlockedTiers = unlockedVocabTiers(myLevel);
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = unlockedTiers.has(requested) ? requested : myLevel;
  const chapters = getChaptersForTopic(topicKey, level);
  const statuses = getChapterStatuses(chapters, reviewedKeys);

  // Resume at the first unfinished chapter; if everything is done, review the last one.
  const currentIndex = statuses.findIndex((s) => s === "current");
  const chapterIndex = currentIndex >= 0 ? currentIndex : Math.max(0, chapters.length - 1);

  redirect(`/vocabulary/${topicKey}/session?chapter=${chapterIndex}&level=${level}`);
}
