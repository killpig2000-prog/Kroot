import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { CHAPTER_UNITS, MINUTES_PER_SESSION, unlockedVocabTiers } from "@/lib/vocabulary";
import { getChaptersForTopic } from "@/lib/vocabulary-words";
import { WORD_STATUSES, wordStatus } from "@/lib/word-notes";
import WordStatusIcon from "@/components/vocabulary/WordStatusIcon";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";

const TOPIC_KEY = "daily-life";
const PREVIEW_WORDS = 5;

// One tier only: chapters. Units still exist underneath as the session-sized
// bite (10 words), but the page never asks the user to pick one — a chapter
// chip bar up top, the chapter's full word list below, and a single
// "continue" that resumes at the first unfinished session.
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

  // select("*") stays valid whether or not migration 0022 (box columns) is applied.
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
  // Words past their review date have "wilted" — chapters containing them show 💧.
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

  const unitWords = getChaptersForTopic(TOPIC_KEY, level);
  const units = unitWords.map((words, i) => {
    const known = words.filter((w) => reviewsByKey.has(w.key)).length;
    const status = known === 0 ? "not-started" : known < words.length ? "in-progress" : "done";
    return { index: i, words, known, status };
  });

  const chapters: {
    index: number;
    units: typeof units;
    words: (typeof unitWords)[number];
    known: number;
    thirsty: number;
    status: "not-started" | "in-progress" | "done";
  }[] = [];
  for (let g = 0; g < units.length; g += CHAPTER_UNITS) {
    const group = units.slice(g, g + CHAPTER_UNITS);
    const words = group.flatMap((u) => u.words);
    const known = group.reduce((sum, u) => sum + u.known, 0);
    const thirsty = words.filter((w) => thirstyKeys.has(w.key)).length;
    chapters.push({
      index: chapters.length,
      units: group,
      words,
      known,
      thirsty,
      status: known === 0 ? "not-started" : known < words.length ? "in-progress" : "done",
    });
  }

  const rootedWords = chapters.reduce((sum, c) => sum + c.known, 0);
  const totalWords = chapters.reduce((sum, c) => sum + c.words.length, 0);
  const thirstyTotal = chapters.reduce((sum, c) => sum + c.thirsty, 0);
  // Thirsty words at the level being browsed only count for the level you're
  // actually at — the Review queue is level-wide, so the card only offers
  // review when the numbers line up.
  const waterCount = level === myLevel ? thirstyTotal : 0;

  const upNext = chapters.find((c) => c.status !== "done") ?? chapters[0] ?? null;
  // ?chapter= is the canonical deep link; old ?unit= links land on that
  // unit's chapter.
  const requestedChapter = Number(sp.chapter);
  const legacyUnit = Number(sp.unit);
  const selected = Number.isInteger(requestedChapter) && chapters[requestedChapter]
    ? chapters[requestedChapter]
    : Number.isInteger(legacyUnit) && units[legacyUnit]
    ? chapters[Math.floor(legacyUnit / CHAPTER_UNITS)]
    : upNext;

  // Sessions still run on the 10-word unit underneath; "continue" resumes at
  // the chapter's first unfinished one.
  const resumeUnit = (c: NonNullable<typeof upNext>) =>
    c.units.find((u) => u.status !== "done") ?? c.units[0];

  const sessionHref = (c: NonNullable<typeof upNext>) =>
    `/vocabulary/${TOPIC_KEY}/session?chapter=${resumeUnit(c).index}&level=${level}`;
  const chapterHref = (ci: number) => `/vocabulary?level=${level}&chapter=${ci}`;
  const wordHref = (unit: number, i: number) =>
    `/vocabulary/${TOPIC_KEY}/word?level=${level}&chapter=${unit}&i=${i}`;
  const ctaLabel = (c: { status: string; known: number; index: number }) =>
    c.status === "done"
      ? `Review Chapter ${c.index + 1} →`
      : c.known > 0
      ? `Continue Chapter ${c.index + 1} →`
      : `Study Chapter ${c.index + 1} →`;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[170px] md:pb-[60px] max-w-[980px]">
          {/* head */}
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
                <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[var(--tint-violet)] text-[#6B33CC] border border-[var(--tint-violet-line)] items-center justify-center kr text-[15px] mr-[9px]">
                  단
                </span>
                {tn("vocabulary")} · {level}
              </h1>
              <p className="text-[13px] text-muted mt-1 tabular-nums">
                {chapters.length} chapter{chapters.length === 1 ? "" : "s"} · {totalWords} words
                {otherLevels.length > 0 && (
                  <span className="text-faint">
                    {" · "}
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
              </p>
            </div>
          </div>

          {/* ── up next ── */}
          {upNext && (
            <section
              aria-label={t("upNext")}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 sm:gap-[18px] items-center bg-cream border border-[var(--tint-violet-line)] rounded-[14px] px-4 py-4 sm:px-[22px] sm:py-[18px] mb-5 shadow-[0_4px_0_#DDD6FE]"
            >
              <div className="min-w-0">
                <h2 className="font-bold text-[20px] sm:text-[24px] tracking-[-0.02em] leading-[1.15]">
                  Chapter {upNext.index + 1}
                </h2>
                <p className="text-[12.5px] text-muted mt-1.5 tabular-nums">
                  {upNext.words.length} words · ~{MINUTES_PER_SESSION} min a session
                  {upNext.status === "done" ? (
                    <span className="text-success font-bold"> · all rooted</span>
                  ) : upNext.known > 0 ? (
                    <span className="text-amber font-bold"> · 🌱 {upNext.known} already sprouted</span>
                  ) : null}
                </p>
                <p className="text-[13.5px] font-medium mt-2 truncate">
                  <span className="kr">
                    {resumeUnit(upNext)
                      .words.slice(0, PREVIEW_WORDS)
                      .map((w) => w.korean)
                      .join(" · ")}
                  </span>
                  <span className="text-faint"> …</span>
                </p>
              </div>
              {/* On phones the action lives in the bar pinned above the bottom nav. */}
              <div className="hidden sm:flex flex-col gap-2 items-stretch min-w-[220px]">
                <Link
                  href={sessionHref(upNext)}
                  className="inline-flex items-center justify-center rounded-[9px] px-5 py-[11px] text-sm font-bold text-white bg-success hover:bg-success-deep transition-colors whitespace-nowrap"
                >
                  {ctaLabel(upNext)}
                </Link>
                {waterCount > 0 && (
                  <Link
                    href="/review"
                    className="inline-flex items-center justify-center rounded-[9px] px-4 py-2 text-[13px] font-bold text-sky-deep bg-[var(--tint-sky)] border border-sky-line hover:bg-sky-line transition-colors whitespace-nowrap"
                  >
                    💧 Review {waterCount} due word{waterCount === 1 ? "" : "s"}
                  </Link>
                )}
              </div>
            </section>
          )}

          {/* ── chapter chip bar ── */}
          <nav
            aria-label={t("allChapters")}
            className="mb-4 sticky top-[52px] md:top-0 z-20 -mx-1 px-1 pt-1 bg-warm/95 backdrop-blur-sm"
          >
            <div className="flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible pb-1.5">
              {chapters.map((c) => {
                const current = c.index === selected?.index;
                return (
                  <Link
                    key={c.index}
                    href={chapterHref(c.index)}
                    aria-current={current ? "true" : undefined}
                    className={`flex-none inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                      current
                        ? "bg-[#6B33CC] border-[#6B33CC] text-white"
                        : c.status === "done"
                        ? "bg-cream border-line text-muted hover:border-charcoal"
                        : "bg-cream border-line hover:border-charcoal"
                    }`}
                  >
                    {c.status === "done" && !current && <span className="text-success text-[11px]">✓</span>}
                    Chapter {c.index + 1}
                    <span
                      className={`text-[10.5px] tabular-nums font-semibold ${
                        current ? "text-white/80" : c.thirsty > 0 ? "text-sky-deep" : "text-faint"
                      }`}
                    >
                      {c.thirsty > 0
                        ? `💧${c.thirsty}`
                        : c.status === "not-started"
                        ? "—"
                        : `${c.known}/${c.words.length}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── chapter word list ── */}
          <section className="min-w-0" id="chapter">
            {selected ? (
              <>
                <div className="flex items-start justify-between gap-4 pb-3.5 mb-1 border-b border-line">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-[22px] tracking-[-0.02em]">Chapter {selected.index + 1}</h2>
                    <p className="text-[12.5px] text-muted mt-0.5 tabular-nums">
                      {selected.known}/{selected.words.length} words
                      {selected.thirsty > 0 && ` · 💧 ${selected.thirsty} due`}
                    </p>
                    <span
                      className="block relative h-[5px] max-w-[320px] rounded-full bg-warm-3 mt-2"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={selected.words.length}
                      aria-valuenow={selected.known}
                      aria-label={`${selected.known} of ${selected.words.length} words rooted`}
                    >
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bg-[#6B33CC]"
                        style={{
                          width: `${
                            selected.words.length
                              ? Math.round((selected.known / selected.words.length) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-2.5 flex-none">
                    <span
                      className={`text-[11.5px] font-bold rounded-full border px-2.5 py-[3px] whitespace-nowrap ${
                        selected.thirsty > 0
                          ? "text-sky-deep bg-[var(--tint-sky)] border-sky-line"
                          : selected.status === "done"
                          ? "text-success bg-success-bg border-success-line"
                          : selected.status === "in-progress"
                          ? "text-amber bg-[var(--tint-amber)] border-amber-line"
                          : "text-faint bg-warm border-line"
                      }`}
                    >
                      {selected.thirsty > 0
                        ? t("dueForReview")
                        : selected.status === "done"
                        ? t("known")
                        : selected.status === "in-progress"
                        ? t("learning")
                        : t("new")}
                    </span>
                    <Link
                      href={sessionHref(selected)}
                      className="rounded-[9px] px-4 py-2 text-[13px] font-bold bg-cream border border-line hover:border-charcoal transition-colors whitespace-nowrap"
                    >
                      {selected.status === "done"
                        ? t("review")
                        : selected.known > 0
                        ? t("continue")
                        : t("study")}
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8">
                  {selected.units.map((u, ui) => {
                    const start = selected.units.slice(0, ui).reduce((sum, p) => sum + p.words.length, 0);
                    return u.words.map((w, wi) => {
                      const status = wordStatus(reviewsByKey.get(w.key) ?? 0);
                      const thirsty = thirstyKeys.has(w.key);
                      const n = start + wi + 1;
                      return (
                        <Link
                          key={w.key}
                          href={wordHref(u.index, wi)}
                          className="group grid grid-cols-[26px_22px_minmax(84px,auto)_1fr_16px] sm:grid-cols-[26px_22px_112px_1fr_16px] items-center gap-x-3 gap-y-0.5 py-2.5 border-b border-dashed border-dash hover:bg-warm transition-colors -mx-2 px-2 rounded-[6px]"
                        >
                          <span className="text-[11px] text-faint tabular-nums text-right">{n}</span>
                          <span title={`${WORD_STATUSES[status].label}${thirsty ? " · due" : ""}`}>
                            {thirsty ? <span className="text-[14px]">💧</span> : <WordStatusIcon status={status} />}
                          </span>
                          <span className="kr font-bold text-[17px] leading-tight">{w.korean}</span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold">{getLocalizedMeaning(w, locale)}</span>
                          </span>
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            className="w-4 h-4 text-faint group-hover:text-charcoal group-hover:translate-x-0.5 transition-all"
                          >
                            <path
                              d="M6 3.5 10.5 8 6 12.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                      );
                    });
                  })}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-muted py-6">{t("noChaptersAtLevel")}</p>
            )}

            {/* growth legend + tally */}
            <div className="mt-7 pt-4 border-t border-line flex items-center justify-end text-[12px] text-muted">
              <span className="tabular-nums">
                <b className="text-charcoal">{rootedWords}</b> of {totalWords} words rooted
              </span>
            </div>
          </section>
        </main>
      </div>

      {/* Phone: the one action, pinned above the bottom nav. */}
      {upNext && (
        <div className="md:hidden fixed left-0 right-0 bottom-[62px] z-30 px-3.5 pt-6 pb-2.5 bg-gradient-to-t from-warm from-70% to-warm/0 pointer-events-none">
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center pointer-events-auto">
            <Link
              href={sessionHref(upNext)}
              className="inline-flex items-center justify-center rounded-[9px] px-4 py-3 text-sm font-bold text-white bg-success shadow-[0_6px_16px_-8px_rgba(46,91,65,.5)] whitespace-nowrap"
            >
              {ctaLabel(upNext)}
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
