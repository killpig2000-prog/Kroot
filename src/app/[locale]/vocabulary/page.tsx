import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import LevelTabs from "@/components/ui/LevelTabs";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { CHAPTER_UNITS, MINUTES_PER_SESSION, getChaptersForTopic, unitLabel, unlockedVocabTiers } from "@/lib/vocabulary";
import { WORD_STATUSES, wordStatus } from "@/lib/word-notes";
import WordStatusIcon from "@/components/vocabulary/WordStatusIcon";
import VocabSearch from "@/components/vocabulary/VocabSearch";
import { LEVEL_ORDER, isCefrLevel, nextLevel, type CefrLevel } from "@/lib/tree";
import { getLocalizedMeaning } from "@/lib/vocabulary-i18n";

const TOPIC_KEY = "daily-life";
const PREVIEW_WORDS = 5;

// The vocab index as a notebook: one "Up next" card with the single obvious
// action, a horizontally-scrolling chapter chip bar (same on phone and
// desktop) that always shows where you are, and a preview of the selected
// unit's words below it.
export default async function VocabularyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string; unit?: string; all?: string }>;
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
  // Words past their review date have "wilted" — units containing them show 💧.
  const now = new Date();
  const thirstyKeys = new Set(
    (progressRows ?? [])
      .filter((r) => r.next_review_at && new Date(r.next_review_at) <= now)
      .map((r) => r.word_key)
  );

  const unlockedTiers = unlockedVocabTiers(myLevel);
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = unlockedTiers.has(requested) ? requested : myLevel;
  const next = nextLevel(level);
  const showAll = sp.all === "1";

  const chapterWords = getChaptersForTopic(TOPIC_KEY, level);
  const units = chapterWords.map((words, i) => {
    const known = words.filter((w) => reviewsByKey.has(w.key)).length;
    const thirsty = words.filter((w) => thirstyKeys.has(w.key)).length;
    const status = known === 0 ? "not-started" : known < words.length ? "in-progress" : "done";
    return { index: i, words, known, thirsty, status };
  });
  const doneUnits = units.filter((u) => u.status === "done").length;
  const rootedWords = units.reduce((sum, u) => sum + u.known, 0);
  const totalWords = units.reduce((sum, u) => sum + u.words.length, 0);
  const thirstyTotal = units.reduce((sum, u) => sum + u.thirsty, 0);
  // Thirsty words at the level being browsed only count for the level you're
  // actually at — the Review queue is level-wide, so the card only offers
  // review when the numbers line up.
  const waterCount = level === myLevel ? thirstyTotal : 0;

  const chapters: (typeof units)[] = [];
  for (let g = 0; g < units.length; g += CHAPTER_UNITS) chapters.push(units.slice(g, g + CHAPTER_UNITS));

  const upNext = units.find((u) => u.status !== "done") ?? units[0] ?? null;
  const requestedUnit = Number(sp.unit);
  const selected =
    Number.isInteger(requestedUnit) && units[requestedUnit] ? units[requestedUnit] : upNext;
  const chapterOf = (unitIndex: number) => Math.floor(unitIndex / CHAPTER_UNITS);
  const openChapter = selected ? chapterOf(selected.index) : -1;

  // Where you stand on the level: finished units plus the fraction of the one
  // in progress. Drives the rail under the card.
  const position = upNext ? upNext.index + upNext.known / Math.max(1, upNext.words.length) : units.length;
  const railPct = units.length ? Math.min(100, Math.round((position / units.length) * 1000) / 10) : 0;

  const sessionHref = (unit: number) => `/vocabulary/${TOPIC_KEY}/session?chapter=${unit}&level=${level}`;
  const unitHref = (unit: number) => `/vocabulary?level=${level}&unit=${unit}${showAll ? "&all=1" : ""}`;
  const wordHref = (unit: number, i: number) =>
    `/vocabulary/${TOPIC_KEY}/word?level=${level}&chapter=${unit}&i=${i}`;
  const ctaLabel = (u: { status: string; known: number; index: number }) =>
    u.status === "done"
      ? `Review ${unitLabel(u.index)} →`
      : u.known > 0
      ? `Continue ${unitLabel(u.index)} →`
      : `Study ${unitLabel(u.index)} →`;
  const unitStatus = (u: { status: string; known: number; thirsty: number; words: unknown[] }) =>
    u.thirsty > 0 ? `💧 ${u.thirsty}` : u.status === "not-started" ? "—" : `${u.known}/${u.words.length}`;

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
          {/* breadcrumb + word lookup */}
          <div className="flex justify-end mb-[18px]">
            <VocabSearch />
          </div>

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
                {chapters.length} chapter{chapters.length === 1 ? "" : "s"} · {units.length} units
                <span className="hidden sm:inline"> · {totalWords} words</span>
              </p>
            </div>
            <LevelTabs
              className="min-w-0 max-w-full"
              levels={LEVEL_ORDER}
              current={level}
              mine={myLevel}
              unlocked={(lv) => unlockedTiers.has(lv)}
              href={(lv) => `/vocabulary?level=${lv}`}
              accent="bg-charcoal border-charcoal text-cream"
            />
          </div>

          {/* ── up next ── */}
          {upNext && (
            <section
              aria-label={t("upNext")}
              className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 sm:gap-[18px] items-center bg-cream border border-[var(--tint-violet-line)] rounded-[14px] px-4 py-4 sm:px-[22px] sm:py-[18px] mb-4 shadow-[0_4px_0_#DDD6FE]"
            >
              <div className="min-w-0">
                <h2 className="font-bold text-[20px] sm:text-[24px] tracking-[-0.02em] leading-[1.15]">
                  {unitLabel(upNext.index)}
                  <small className="font-semibold text-faint text-[14px] sm:text-[15px] ml-2">
                    Chapter {chapterOf(upNext.index) + 1}
                  </small>
                </h2>
                <p className="text-[12.5px] text-muted mt-1.5 tabular-nums">
                  {upNext.words.length} words · ~{MINUTES_PER_SESSION} min
                  {upNext.status === "done" ? (
                    <span className="text-success font-bold"> · all rooted</span>
                  ) : upNext.known > 0 ? (
                    <span className="text-amber font-bold"> · 🌱 {upNext.known} already sprouted</span>
                  ) : null}
                </p>
                <p className="text-[13.5px] font-medium mt-2 truncate">
                  <span className="kr">
                    {upNext.words
                      .slice(0, PREVIEW_WORDS)
                      .map((w) => w.korean)
                      .join(" · ")}
                  </span>
                  {upNext.words.length > PREVIEW_WORDS && (
                    <span className="text-faint"> +{upNext.words.length - PREVIEW_WORDS} more</span>
                  )}
                </p>
              </div>
              {/* On phones the action lives in the bar pinned above the bottom nav. */}
              <div className="hidden sm:flex flex-col gap-2 items-stretch min-w-[220px]">
                <Link
                  href={sessionHref(upNext.index)}
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

          {/* ── where am I rail ── */}
          {upNext && (
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center text-[12px] text-muted mx-1 mb-5 sm:mb-6 tabular-nums">
              <span>
                <b className="text-charcoal">{unitLabel(upNext.index)}</b> of {units.length}
              </span>
              <span
                className="relative h-[5px] rounded-full bg-warm-3 overflow-visible"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={units.length}
                aria-valuenow={doneUnits}
                aria-label={`${doneUnits} of ${units.length} units done`}
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[#6B33CC]"
                  style={{ width: `${railPct}%` }}
                />
                <span
                  className="absolute top-[-3px] w-[11px] h-[11px] -ml-[5px] rounded-full bg-cream border-[2.5px] border-[#6B33CC]"
                  style={{ left: `${railPct}%` }}
                />
              </span>
              <span className="whitespace-nowrap">
                {next ? (
                  <>
                    → <b className="text-charcoal">{next}</b>
                  </>
                ) : null}
              </span>
            </div>
          )}

          {/* ── chapter chip bar ── */}
          <nav
            aria-label="Chapters"
            className="mb-3 sticky top-[52px] md:top-0 z-20 -mx-1 px-1 pt-1 bg-warm/95 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold tracking-[.06em] uppercase text-[#6B33CC]">
                Chapters
              </span>
              <Link
                href={`/vocabulary?level=${level}${selected ? `&unit=${selected.index}` : ""}${showAll ? "" : "&all=1"}`}
                className="text-[11.5px] font-bold tracking-normal normal-case text-[#6B33CC] hover:underline"
              >
                {showAll ? t("showChapters") : t("showAllUnits")}
              </Link>
            </div>
            <div className="flex gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible pb-1.5">
              {chapters.map((group, ci) => {
                const chapterDone = group.filter((u) => u.status === "done").length;
                const chapterThirsty = group.reduce((sum, u) => sum + u.thirsty, 0);
                const allDone = chapterDone === group.length;
                const current = ci === openChapter;
                // The chip jumps to the chapter's first unfinished unit; the
                // page then opens that chapter's units below.
                const target = group.find((u) => u.status !== "done") ?? group[0];
                return (
                  <Link
                    key={ci}
                    href={unitHref(target.index)}
                    aria-current={current ? "true" : undefined}
                    className={`flex-none inline-flex items-center gap-1.5 rounded-full border px-3.5 py-[7px] text-[12.5px] font-bold whitespace-nowrap transition-colors ${
                      current
                        ? "bg-[#6B33CC] border-[#6B33CC] text-white"
                        : allDone
                        ? "bg-cream border-line text-muted hover:border-charcoal"
                        : "bg-cream border-line hover:border-charcoal"
                    }`}
                  >
                    {allDone && !current && <span className="text-success text-[11px]">✓</span>}
                    Chapter {ci + 1}
                    <span
                      className={`text-[10.5px] tabular-nums font-semibold ${
                        current ? "text-white/80" : chapterThirsty > 0 ? "text-sky-deep" : "text-faint"
                      }`}
                    >
                      {chapterThirsty > 0 ? `💧${chapterThirsty}` : `${chapterDone}/${group.length}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* ── unit pills for the open chapter(s) ── */}
          <div className="flex flex-col gap-2.5 mb-5">
            {(showAll ? chapters : chapters.slice(openChapter, openChapter + 1)).map((group, gi) => {
              const ci = showAll ? gi : openChapter;
              return (
                <div key={ci} className="flex items-center gap-2 overflow-x-auto lg:flex-wrap lg:overflow-visible">
                  {showAll && (
                    <span className="flex-none text-[11px] font-bold text-faint tabular-nums pr-0.5">
                      Ch.{ci + 1}
                    </span>
                  )}
                  {group.map((u) => {
                    const on = selected?.index === u.index;
                    return (
                      <Link
                        key={u.index}
                        href={unitHref(u.index)}
                        aria-current={on ? "page" : undefined}
                        className={`flex-none inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                          on
                            ? "bg-[var(--tint-violet)] border-[var(--tint-violet-line)] text-[#713FC0] font-extrabold"
                            : "bg-cream border-line hover:border-charcoal"
                        } ${u.status === "done" && !on ? "text-muted" : ""}`}
                      >
                        {unitLabel(u.index)}
                        <span
                          className={`text-[10px] tabular-nums ${
                            u.thirsty > 0
                              ? "text-sky-deep font-bold"
                              : on
                              ? "text-[#6B33CC] font-bold"
                              : u.status === "done"
                              ? "text-success"
                              : "text-faint"
                          }`}
                        >
                          {unitStatus(u)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* ── unit preview ── */}
          <section className="min-w-0" id="unit">
            {selected ? (
                <>
                  <div className="flex items-start justify-between gap-4 pb-3.5 mb-1 border-b border-line">
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold tracking-[.06em] uppercase text-[#6B33CC] mb-1">
                        Chapter {chapterOf(selected.index) + 1} · Units{" "}
                        {chapterOf(selected.index) * CHAPTER_UNITS + 1}–
                        {Math.min(units.length, (chapterOf(selected.index) + 1) * CHAPTER_UNITS)}
                      </p>
                      <h2 className="font-bold text-[22px] tracking-[-0.02em]">{unitLabel(selected.index)}</h2>
                      <p className="text-[12.5px] text-muted mt-0.5 tabular-nums">
                        {selected.words.length} words · ~{MINUTES_PER_SESSION} min ·{" "}
                        {selected.status === "done"
                          ? "all rooted"
                          : selected.known > 0
                          ? `${selected.known} already sprouted`
                          : "not planted yet"}
                        {selected.thirsty > 0 && ` · 💧 ${selected.thirsty} due`}
                      </p>
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
                        href={sessionHref(selected.index)}
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
                    {selected.words.map((w, wi) => {
                      const status = wordStatus(reviewsByKey.get(w.key) ?? 0);
                      const thirsty = thirstyKeys.has(w.key);
                      return (
                        <Link
                          key={w.key}
                          href={wordHref(selected.index, wi)}
                          className="group grid grid-cols-[22px_minmax(84px,auto)_1fr_16px] sm:grid-cols-[22px_112px_1fr_16px] items-center gap-x-3 gap-y-0.5 py-2.5 border-b border-dashed border-dash hover:bg-warm transition-colors -mx-2 px-2 rounded-[6px]"
                        >
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
                    })}
                  </div>
                </>
            ) : (
              <p className="text-[13px] text-muted py-6">No units at this level yet.</p>
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
              href={sessionHref(upNext.index)}
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
