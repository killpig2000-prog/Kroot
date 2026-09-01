import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { CHAPTER_UNITS, unlockedVocabTiers } from "@/lib/vocabulary";
import { getChaptersForTopic } from "@/lib/vocabulary-words";
import { WORD_STATUSES, wordStatus } from "@/lib/word-notes";
import WordStatusIcon from "@/components/vocabulary/WordStatusIcon";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";

const TOPIC_KEY = "daily-life";

// Days, not chapters: each day is one 10-word session. Done days collapse to
// a line, the next unfinished day is the one big card, everything after is a
// locked stub with no words shown. "Chapter" survives only as a light,
// non-clickable divider every CHAPTER_UNITS days so long stretches don't
// blur together — there's no real per-chapter theme data to name it with.
export default async function VocabularyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string; chapter?: string; unit?: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("vocabulary");
  const tn = await getTranslations("nav");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [profile, { data: progressRows }, sp] = await Promise.all([
    getDashboardProfile(supabase, user.id),
    supabase
      .from("vocabulary_progress")
      .select("*")
      .eq("user_id", user.id)
      .not("last_reviewed_at", "is", null),
    searchParams,
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const reviewsByKey = new Map(
    (progressRows ?? []).map((r) => [r.word_key as string, (r.correct_count ?? 0) + (r.incorrect_count ?? 0)])
  );
  const now = new Date();
  const thirstyKeys = new Set(
    (progressRows ?? [])
      .filter((r) => r.next_review_at && new Date(r.next_review_at) <= now)
      .map((r) => r.word_key)
  );

  const unlockedTiers = unlockedVocabTiers(myLevel);
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = unlockedTiers.has(requested) ? requested : myLevel;
  const otherLevels = LEVEL_ORDER.filter((lv) => unlockedTiers.has(lv) && lv !== level);

  const dayWords = getChaptersForTopic(TOPIC_KEY, level);
  const days = dayWords.map((words, i) => {
    const known = words.filter((w) => reviewsByKey.has(w.key)).length;
    const thirsty = words.filter((w) => thirstyKeys.has(w.key)).length;
    const done = words.length > 0 && known === words.length;
    return { index: i, words, known, thirsty, done };
  });

  // Sequential unlock: everything up to and including the first unfinished
  // day is visible/interactive, the rest are locked stubs.
  const firstOpenIndex = days.findIndex((d) => !d.done);
  const currentIndex = firstOpenIndex === -1 ? days.length - 1 : firstOpenIndex;

  const totalWords = days.reduce((sum, d) => sum + d.words.length, 0);
  const learnedWords = days.reduce((sum, d) => sum + d.known, 0);
  const thirstyTotal = days.reduce((sum, d) => sum + d.thirsty, 0);
  const waterCount = level === myLevel ? thirstyTotal : 0;

  const requestedDay = Number(sp.chapter ?? sp.unit);
  const jumpTo = Number.isInteger(requestedDay) && days[requestedDay] ? requestedDay : null;

  const sessionHref = (dayIndex: number) => `/vocabulary/${TOPIC_KEY}/session?chapter=${dayIndex}&level=${level}`;
  const wordHref = (dayIndex: number, i: number) =>
    `/vocabulary/${TOPIC_KEY}/word?level=${level}&chapter=${dayIndex}&i=${i}`;
  const ctaLabel = (d: (typeof days)[number]) =>
    d.known > 0 ? t("continue") : t("study");

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[170px] md:pb-[60px] max-w-[720px]">
          {/* head + progress */}
          <div className="sticky top-[52px] md:top-0 z-20 -mx-1 px-1 pt-1 pb-3 bg-warm/95 backdrop-blur-sm">
            <div className="flex items-end justify-between gap-4 mb-3 flex-wrap">
              <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
                <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-violet)] text-[#6B33CC] border border-[var(--tint-violet-line)] items-center justify-center kr text-[15px] mr-[9px]">
                  단
                </span>
                {tn("vocabulary")} · {level}
                {otherLevels.length > 0 && (
                  <span className="text-[13px] text-faint font-normal ml-2">
                    {otherLevels.map((lv, i) => (
                      <span key={lv}>
                        {i > 0 && " "}
                        <Link href={`/vocabulary?level=${lv}`} className="underline hover:text-charcoal">
                          {lv}
                        </Link>
                      </span>
                    ))}
                  </span>
                )}
              </h1>
            </div>
            <div className="flex items-center justify-between text-[12px] font-bold text-muted tabular-nums">
              <span>{t("dayOf", { day: currentIndex + 1, total: days.length })}</span>
              <span>{t("wordsLearnedCount", { n: learnedWords })}</span>
            </div>
            <div className="relative h-[6px] rounded-full bg-warm-3 mt-1.5 overflow-hidden">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-[#6B33CC]"
                style={{ width: `${totalWords ? Math.round((learnedWords / totalWords) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* ── day path ── */}
          <div className="relative pl-2">
            <div className="absolute left-[15px] top-1 bottom-8 w-[2px] bg-line-soft" aria-hidden="true" />
            <div className="flex flex-col gap-2">
              {days.map((d, i) => {
                const chapterStart = i % CHAPTER_UNITS === 0;
                const chapterN = Math.floor(i / CHAPTER_UNITS) + 1;
                const isDone = i < currentIndex || (i === currentIndex && d.done);
                const isCurrent = i === currentIndex && !d.done;
                const isLocked = i > currentIndex;
                const shouldOpen = jumpTo === i;

                return (
                  <div key={d.index}>
                    {chapterStart && (
                      <div className="flex items-center gap-2.5 mt-4 mb-1.5 first:mt-0 relative z-10">
                        <span className="w-[8px] h-[8px] rounded-full bg-[#6B33CC] flex-none ml-[6px]" />
                        <span className="text-[11px] font-bold uppercase tracking-[.08em] text-faint bg-warm pr-2">
                          {t("chapter")} {chapterN} · {t("wordsCount", { n: Math.min(CHAPTER_UNITS * 10, totalWords - i * 10) })}
                        </span>
                      </div>
                    )}

                    {isCurrent ? (
                      <div
                        id={`day-${d.index}`}
                        className="relative z-10 rounded-[12px] border-[1.5px] p-4 border-[#DCCEF0] bg-[var(--tint-violet)]"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <b className="font-bold text-[18px]">{t("dayN", { n: d.index + 1 })}</b>
                          <span className="text-[11.5px] text-faint font-semibold tabular-nums">
                            {t("minWords", { n: d.words.length, min: Math.ceil(d.words.length * 0.6) })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2.5 mb-3.5">
                          {d.words.map((w) => (
                            <span key={w.key} className="kr text-[13px] font-medium px-2.5 py-1 rounded-full bg-cream border border-[#DCCEF0]">
                              {w.korean}
                            </span>
                          ))}
                        </div>
                        <Link
                          href={sessionHref(d.index)}
                          className="flex items-center justify-center w-full rounded-[9px] px-4 py-2.5 text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors"
                        >
                          {ctaLabel(d)} · {t("dayN", { n: d.index + 1 })}
                        </Link>
                        {d.thirsty > 0 && (
                          <p className="text-[12px] text-muted text-center font-semibold mt-2">
                            {t("tryTheseTricky", { n: d.thirsty })}
                          </p>
                        )}
                      </div>
                    ) : isLocked ? (
                      <div className="relative z-10 flex items-center gap-3 rounded-[12px] border border-dashed border-line px-4 py-2.5">
                        <span className="w-[28px] h-[28px] rounded-full border-2 border-line text-faint text-[12px] font-black flex items-center justify-center flex-none">
                          {d.index + 1}
                        </span>
                        <span className="text-[13.5px] font-bold text-faint">{t("dayN", { n: d.index + 1 })}</span>
                        <span className="text-[12px] text-faint ml-auto">{t("wordsCount", { n: d.words.length })}</span>
                      </div>
                    ) : (
                      <details className="relative z-10 group" open={shouldOpen}>
                        <summary className="list-none cursor-pointer flex items-center gap-3 rounded-[12px] border border-line bg-warm px-4 py-2.5 hover:border-charcoal transition-colors">
                          <span className="w-[28px] h-[28px] rounded-full bg-success text-white text-[12px] font-black flex items-center justify-center flex-none">
                            ✓
                          </span>
                          <span className="text-[13.5px] font-bold">{t("dayN", { n: d.index + 1 })}</span>
                          <span className="text-[12px] text-muted ml-auto tabular-nums">
                            {d.known}/{d.words.length}
                            {d.thirsty > 0 && <span className="text-sky-deep"> · 💧{d.thirsty}</span>}
                          </span>
                        </summary>
                        <div className="mt-1.5 mb-1 pl-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                            {d.words.map((w, wi) => {
                              const status = wordStatus(reviewsByKey.get(w.key) ?? 0);
                              const thirsty = thirstyKeys.has(w.key);
                              return (
                                <Link
                                  key={w.key}
                                  href={wordHref(d.index, wi)}
                                  className="group/word grid grid-cols-[20px_100px_1fr] items-center gap-x-2.5 py-1.5 border-b border-dashed border-dash hover:bg-warm transition-colors -mx-1.5 px-1.5 rounded-[6px]"
                                >
                                  <span title={`${WORD_STATUSES[status].label}${thirsty ? " · due" : ""}`}>
                                    <WordStatusIcon status={status} />
                                  </span>
                                  <span className="kr font-bold text-[15px] leading-tight">{w.korean}</span>
                                  <span className="text-[12.5px] font-semibold truncate">{getLocalizedMeaning(w, locale)}</span>
                                </Link>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Link
                              href={sessionHref(d.index)}
                              className="flex-1 text-center text-[12.5px] font-bold px-3 py-2 rounded-[8px] border border-line bg-cream hover:border-charcoal transition-colors"
                            >
                              {t("studyAgain")}
                            </Link>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {days.length === 0 && <p className="text-[13px] text-muted py-6">{t("noChaptersAtLevel")}</p>}
        </main>
      </div>

      {days[currentIndex] && !days[currentIndex].done && (
        <div className="md:hidden fixed left-0 right-0 bottom-[62px] z-30 px-3.5 pt-6 pb-2.5 bg-gradient-to-t from-warm from-70% to-warm/0 pointer-events-none">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center pointer-events-auto">
            <Link
              href={sessionHref(currentIndex)}
              className="inline-flex items-center justify-center rounded-[9px] px-4 py-3 text-sm font-bold text-white bg-success shadow-[0_6px_16px_-8px_rgba(46,91,65,.5)] whitespace-nowrap"
            >
              {t("startDay", { n: currentIndex + 1 })}
            </Link>
            {waterCount > 0 && (
              <Link
                href="/review"
                aria-label={`Review ${waterCount} due words`}
                className="inline-flex items-center justify-center rounded-[9px] px-3 py-3 text-[13px] font-bold text-sky-deep bg-[var(--tint-sky)] border border-sky-line tabular-nums"
              >
                💧 {waterCount}
              </Link>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
