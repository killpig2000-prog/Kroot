import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import VocabSession from "@/components/vocabulary/VocabSession";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import {
  VOCAB_TOPICS,
  getChaptersForTopic,
  sortForReview,
  type VocabWordWithProgress,
} from "@/lib/vocabulary";
import { findMoreExamples } from "@/lib/vocab-examples";
import { isCefrLevel, type CefrLevel } from "@/lib/tree";

export default async function VocabChapterSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ topicKey: string }>;
  searchParams: Promise<{ chapter?: string; level?: string }>;
}) {
  const { topicKey } = await params;
  const sp = await searchParams;
  const topic = VOCAB_TOPICS.find((t) => t.key === topicKey && t.available);
  if (!topic) notFound();

  const chapterIndex = Number(sp.chapter ?? 0);

  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const profile = await getDashboardProfile(supabase, user.id);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;

  // Not level-gated: the only way to land on a level above your own here is
  // the vocab search box, which deliberately lets you look up and study any
  // word regardless of your progression — unlike the level tabs on the main
  // vocabulary page, which do stay gated.
  const level = isCefrLevel(sp.level) ? sp.level : myLevel;
  const chapters = getChaptersForTopic(topicKey, level);
  const chapterWords = chapters[chapterIndex] ?? [];

  // select("*") stays valid whether or not migration 0022 (box columns) is applied.
  const { data: progress } = await supabase
    .from("vocabulary_progress")
    .select("*")
    .eq("user_id", user.id)
    .in(
      "word_key",
      chapterWords.map((w) => w.key)
    );

  const progressByKey = new Map((progress ?? []).map((p) => [p.word_key, p]));

  const merged: VocabWordWithProgress[] = chapterWords.map((w) => {
    const p = progressByKey.get(w.key);
    return {
      ...w,
      correct_count: p?.correct_count ?? 0,
      incorrect_count: p?.incorrect_count ?? 0,
      last_reviewed_at: p?.last_reviewed_at ?? null,
      box: p?.box ?? null,
      moreExamples: findMoreExamples(w.korean, w.example_kr),
    };
  });

  const sessionWords = sortForReview(merged);
  const hasNextChapter = chapterIndex + 1 < chapters.length;

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
          <div className="flex gap-2 text-[13px] text-faint mb-[18px] flex-wrap">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <Link href={`/vocabulary?level=${level}`} className="hover:text-charcoal transition-colors">
              Vocabulary
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">{topic.label}</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] items-center justify-center kr text-[15px] mr-[9px]">
                단
              </span>
              {topic.label}
            </h1>
            <span className="text-[13px] text-muted">
              Level {level} · set {chapterIndex + 1} of {chapters.length}
            </span>
          </div>

          <VocabSession
            // Remount when the set changes so the previous set's summary
            // state doesn't survive the navigation.
            key={`${topicKey}-${level}-${chapterIndex}`}
            words={sessionWords}
            userId={user.id}
            topicLabel={topic.label}
            topicKey={topicKey}
            chapterIndex={chapterIndex}
            hasNextChapter={hasNextChapter}
          />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
