import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { MINUTES_PER_SESSION, getChaptersForTopic, getUnitTitle, unlockedVocabTiers } from "@/lib/vocabulary";
import { GROWTH_STAGES, growthStage } from "@/lib/word-notes";
import VocabSearch from "@/components/vocabulary/VocabSearch";
import { LEVEL_ORDER, isCefrLevel, nextLevel, type CefrLevel } from "@/lib/tree";

const TOPIC_KEY = "daily-life";
const GROUP_SIZE = 5;

// The vocab index as a notebook: a table of contents on the left (units,
// grouped five at a time), and on the right a preview of the selected unit's
// words — so you can read what a unit teaches before you commit to it.
export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; unit?: string }>;
}) {
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

  const chapters = getChaptersForTopic(TOPIC_KEY, level);
  const units = chapters.map((words, i) => {
    const known = words.filter((w) => reviewsByKey.has(w.key)).length;
    const thirsty = words.filter((w) => thirstyKeys.has(w.key)).length;
    const status = known === 0 ? "not-started" : known < words.length ? "in-progress" : "done";
    return { index: i, words, known, thirsty, status };
  });
  const doneUnits = units.filter((u) => u.status === "done").length;
  const rootedWords = units.reduce((sum, u) => sum + u.known, 0);
  const totalWords = units.reduce((sum, u) => sum + u.words.length, 0);

  const groups: (typeof units)[] = [];
  for (let g = 0; g < units.length; g += GROUP_SIZE) groups.push(units.slice(g, g + GROUP_SIZE));

  const continueUnit = units.find((u) => u.status !== "done") ?? units[0] ?? null;
  const requestedUnit = Number(sp.unit);
  const selected =
    Number.isInteger(requestedUnit) && units[requestedUnit] ? units[requestedUnit] : continueUnit;
  const openGroupIndex = selected ? Math.floor(selected.index / GROUP_SIZE) : -1;

  const sessionHref = (unit: number) => `/vocabulary/${TOPIC_KEY}/session?chapter=${unit}&level=${level}`;
  const unitHref = (unit: number) => `/vocabulary?level=${level}&unit=${unit}`;
  const wordHref = (unit: number, i: number) =>
    `/vocabulary/${TOPIC_KEY}/word?level=${level}&chapter=${unit}&i=${i}`;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[980px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Vocabulary</b>
          </div>

          {/* head */}
          <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
            <div>
              <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
                <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] items-center justify-center kr text-[15px] mr-[9px]">
                  단
                </span>
                Vocabulary · {level}
              </h1>
              <p className="text-[13px] text-muted mt-1">
                {rootedWords} of {totalWords} words rooted · {doneUnits}/{units.length} units ·{" "}
                {next ? `finish them all to grow into ${next}` : "top level — keep the roots strong"}
              </p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {LEVEL_ORDER.map((lv) =>
                unlockedTiers.has(lv) ? (
                  <Link
                    key={lv}
                    href={`/vocabulary?level=${lv}`}
                    className={`rounded-[8px] px-3 py-1.5 text-[12.5px] font-bold border transition-colors ${
                      lv === level
                        ? "bg-charcoal border-charcoal text-white"
                        : "bg-white border-line text-faint hover:border-faint"
                    }`}
                  >
                    {lv}
                  </Link>
                ) : (
                  <span
                    key={lv}
                    title="Pass the promotion test to unlock this level"
                    className="rounded-[8px] px-3 py-1.5 text-[12.5px] font-bold border bg-warm border-line text-faint opacity-60 cursor-not-allowed select-none"
                  >
                    🔒 {lv}
                  </span>
                )
              )}
            </div>
          </div>

          <VocabSearch />

          <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-6 lg:gap-8">
            {/* ── table of contents ── */}
            <nav
              aria-label="Units"
              className="order-2 lg:order-1 lg:border-r lg:border-line lg:pr-5 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-48px)] lg:overflow-y-auto"
            >
              <p className="text-[11px] font-extrabold tracking-[.07em] uppercase text-faint mb-2">
                Contents · {units.length} units
              </p>
              <div className="flex flex-col gap-1">
                {groups.map((group, gi) => {
                  const first = group[0].index + 1;
                  const last = group[group.length - 1].index + 1;
                  const groupDone = group.filter((u) => u.status === "done").length;
                  return (
                    <details key={gi} open={gi === openGroupIndex} className="group/toc">
                      <summary className="flex items-center gap-2 py-1.5 px-1.5 rounded-[8px] cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-warm transition-colors">
                        <span className="text-[10px] text-faint transition-transform group-open/toc:rotate-90">▶</span>
                        <b className="flex-1 text-[12.5px] font-bold">
                          Units {first}–{last}
                        </b>
                        <small className="text-[11px] text-faint tabular-nums font-semibold">
                          {groupDone}/{group.length}
                        </small>
                      </summary>
                      <div className="flex flex-col pb-1.5">
                        {group.map((u) => {
                          const on = selected?.index === u.index;
                          const pg =
                            u.thirsty > 0
                              ? `💧 ${u.thirsty}`
                              : u.status === "done"
                              ? `${u.known}/${u.words.length}`
                              : u.status === "in-progress"
                              ? `${u.known}/${u.words.length}`
                              : "—";
                          return (
                            <Link
                              key={u.index}
                              href={unitHref(u.index)}
                              aria-current={on ? "true" : undefined}
                              className={`flex items-baseline gap-2 px-2 py-[6px] rounded-[8px] text-[12.5px] transition-colors ${
                                on
                                  ? "bg-[#F5F3FF] text-[#6D28D9] font-bold"
                                  : "hover:bg-warm"
                              }`}
                            >
                              <span className="w-[18px] text-[10.5px] text-faint tabular-nums flex-none">
                                {u.index + 1}
                              </span>
                              <span
                                className={`flex-1 min-w-0 truncate ${
                                  u.status === "done" && !on ? "text-muted line-through decoration-line" : ""
                                }`}
                              >
                                {getUnitTitle(level, u.index)}
                              </span>
                              <span
                                className={`text-[10.5px] tabular-nums flex-none ${
                                  u.thirsty > 0 ? "text-sky-deep font-bold" : on ? "text-[#7C3AED]" : "text-faint"
                                }`}
                              >
                                {pg}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </details>
                  );
                })}
              </div>
            </nav>

            {/* ── unit preview ── */}
            <section className="order-1 lg:order-2 min-w-0">
              {selected ? (
                <>
                  <div className="flex items-end justify-between gap-4 pb-3.5 mb-1 border-b border-line">
                    <div>
                      <p className="text-[11px] font-extrabold tracking-[.06em] uppercase text-[#7C3AED] mb-1">
                        Unit {selected.index + 1} · Units{" "}
                        {Math.floor(selected.index / GROUP_SIZE) * GROUP_SIZE + 1}–
                        {Math.min(units.length, (Math.floor(selected.index / GROUP_SIZE) + 1) * GROUP_SIZE)}
                      </p>
                      <h2 className="font-bold text-[22px] tracking-[-0.02em]">
                        {getUnitTitle(level, selected.index)}
                      </h2>
                      <p className="text-[12.5px] text-muted mt-0.5">
                        {selected.words.length} words · ~{MINUTES_PER_SESSION} min ·{" "}
                        {selected.status === "done"
                          ? "all rooted"
                          : selected.known > 0
                          ? `${selected.known} already sprouted`
                          : "not planted yet"}
                        {selected.thirsty > 0 && ` · 💧 ${selected.thirsty} thirsty`}
                      </p>
                    </div>
                    <span
                      className={`flex-none text-[11.5px] font-bold rounded-full border px-2.5 py-[3px] ${
                        selected.thirsty > 0
                          ? "text-sky-deep bg-[#EFF6FF] border-sky-line"
                          : selected.status === "done"
                          ? "text-success bg-success-bg border-success-line"
                          : selected.status === "in-progress"
                          ? "text-amber bg-[#FFFBEB] border-amber-line"
                          : "text-faint bg-warm border-line"
                      }`}
                    >
                      {selected.thirsty > 0
                        ? "Needs water"
                        : selected.status === "done"
                        ? "Done"
                        : selected.status === "in-progress"
                        ? "In progress"
                        : "New"}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    {selected.words.map((w, wi) => {
                      const st = GROWTH_STAGES[growthStage(reviewsByKey.get(w.key) ?? 0)];
                      const thirsty = thirstyKeys.has(w.key);
                      return (
                        <Link
                          key={w.key}
                          href={wordHref(selected.index, wi)}
                          className="group grid grid-cols-[22px_minmax(84px,auto)_1fr_16px] sm:grid-cols-[22px_112px_1fr_16px] items-center gap-x-3 gap-y-0.5 py-2.5 border-b border-dashed border-dash hover:bg-warm transition-colors -mx-2 px-2 rounded-[6px]"
                        >
                          <span className="text-[14px]" title={`${st.label}${thirsty ? " · thirsty" : ""}`}>
                            {thirsty ? "💧" : st.emoji}
                          </span>
                          <span className="kr font-bold text-[17px] leading-tight">{w.korean}</span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold">{w.meaning_en}</span>
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

                  <div className="flex items-center gap-3 flex-wrap mt-4">
                    <Link
                      href={sessionHref(selected.index)}
                      className="rounded-[9px] px-[22px] py-2.5 text-sm font-semibold text-white bg-charcoal hover:bg-[#3F3F46] transition-colors"
                    >
                      {selected.status === "done"
                        ? "Review this unit →"
                        : selected.known > 0
                        ? "Continue this unit →"
                        : "Study this unit →"}
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-muted py-6">No units at this level yet.</p>
              )}

              {/* growth legend + grow note */}
              <div className="mt-7 pt-4 border-t border-line flex items-center justify-between gap-3 flex-wrap text-[12px] text-muted">
                <span className="flex gap-3.5">
                  {GROWTH_STAGES.map((s) => (
                    <span key={s.label}>
                      {s.emoji} {s.label}
                    </span>
                  ))}
                  <span>💧 Thirsty</span>
                </span>
                {next && (
                  <span>
                    🌳 Finish all {units.length} units to grow into <b className="text-charcoal">{next}</b>
                  </span>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
