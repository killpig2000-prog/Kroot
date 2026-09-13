import { getFormatter, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import LevelCard from "@/components/profile/LevelCard";
import MonthlyGrass from "@/components/profile/MonthlyGrass";
import KnownWords, { type WordBand } from "@/components/profile/KnownWords";
import TreeLedger, { type LedgerRow } from "@/components/profile/TreeLedger";
import PeriodTabs, { asPeriod, periodDays } from "@/components/profile/PeriodTabs";
import { computeSkillProgress } from "@/components/profile/skill-progress";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { selectAll } from "@/lib/select-all";
import type { CefrLevel } from "@/lib/tree";

// My progress: four cards. Words known, the learner's own level and how much
// of it they've done, what grew the tree, and the year's study garden.
// (2026-09-13: this-week chart, weakest-skill nudge, skill balance and the
// review card left — the garden, the dashboard's growth rings and watering
// can, and Settings already cover them.)
//
// Every query is unwrapped error-tolerantly: a stats page must degrade to a
// smaller page, never to a 500.

type VocabRow = {
  word_key: string;
  correct_count: number | null;
  incorrect_count: number | null;
  box: number | null;
  created_at: string | null;
};

type XpRow = { points: number | null; skill: string | null; created_at: string };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const t = await getTranslations("ui.account");
  const tn = await getTranslations("nav");
  const tl = await getTranslations("profile.learn");
  const format = await getFormatter();
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const now = new Date();

  // The window every card reads. It lives in the URL (?p=90), so the page
  // stays a server component and a shared link keeps its period.
  const period = asPeriod((await searchParams).p);
  const windowDays = periodDays(period);
  const windowStart = windowDays == null ? null : new Date(now.getTime() - windowDays * 864e5);
  const windowStartIso = windowStart?.toISOString() ?? null;

  // One parallel batch: from Korea to us-east-1 each round trip is ~300ms,
  // so sequential awaits are the whole difference between fast and sluggish.
  const [
    { data: profile },
    vocabRes,
    readingRes,
    writingRes,
    listeningRes,
    speakingRes,
    grammarRes,
    activityRes,
    xpRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url")
      .eq("id", user.id)
      .single(),
    selectAll<VocabRow>((from, to) =>
      supabase
        .from("vocabulary_progress")
        .select("word_key, correct_count, incorrect_count, box, created_at")
        .eq("user_id", user.id)
        .order("id")
        .range(from, to),
    ),
    supabase.from("reading_progress").select("passage_key").eq("user_id", user.id),
    supabase.from("writing_progress").select("prompt_key").eq("user_id", user.id),
    supabase.from("listening_progress").select("dialogue_id").eq("user_id", user.id).not("completed_at", "is", null),
    supabase.from("speaking_progress").select("prompt_key").eq("user_id", user.id),
    supabase.from("grammar_progress").select("lesson_key").eq("user_id", user.id),
    supabase.from("daily_activity").select("activity_date, minutes").eq("user_id", user.id),
    // What grew the tree: XP with its source. `skill` is null on ~8% of
    // rows (older award_xp calls), which the ledger folds into "other"
    // rather than dropping — the total has to keep adding up.
    selectAll<XpRow>((from, to) => {
      const q = supabase.from("xp_events").select("points, skill, created_at").eq("user_id", user.id);
      return (windowStartIso ? q.gte("created_at", windowStartIso) : q).order("id").range(from, to);
    }),
  ]);

  let vocabRows = vocabRes.error ? [] : vocabRes.data;
  if (vocabRes.error) {
    const retry = await selectAll<Omit<VocabRow, "box" | "created_at">>((from, to) =>
      supabase
        .from("vocabulary_progress")
        .select("word_key, correct_count, incorrect_count")
        .eq("user_id", user.id)
        .order("id")
        .range(from, to),
    );
    vocabRows = retry.error ? [] : retry.data.map((r) => ({ ...r, box: null, created_at: null }));
  }
  const xpRows = xpRes.error ? [] : xpRes.data;
  const keys = <T,>(res: { error: unknown; data: T[] | null }) => (res.error ? [] : res.data ?? []);
  const readingRows = keys(readingRes);
  const writingRows = keys(writingRes);
  const listeningRows = keys(listeningRes);
  const speakingRows = keys(speakingRes);
  const grammarRows = keys(grammarRes);
  const activityRows = keys(activityRes);

  const level = (profile?.current_level ?? "A1") as CefrLevel;
  const streakDays = profile?.streak_days ?? 0;

  // ── level progress: the level card's bars ─────────────────────────────
  const skillProgress = computeSkillProgress({
    cefr: level,
    grammarKeys: grammarRows.map((r) => r.lesson_key),
    vocabKeys: vocabRows.map((r) => r.word_key),
    listeningIds: listeningRows.map((r) => r.dialogue_id),
    readingKeys: readingRows.map((r) => r.passage_key),
    writingKeys: writingRows.map((r) => r.prompt_key),
    speakingKeys: speakingRows.map((r) => r.prompt_key),
  });

  const totalMinutes = activityRows.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const minutesByDate = new Map(activityRows.map((r) => [r.activity_date, r.minutes ?? 0]));
  const wordsLearned = vocabRows.filter((r) => (r.correct_count ?? 0) + (r.incorrect_count ?? 0) > 0).length;

  // ── words you know ──────────────────────────────────────────────────────
  // "Known" means answered at least once — the same rule the old stat tile
  // used, now the headline. The four bands are the SRS boxes: 1 just met,
  // 2 still shaky, 3 solid, 4-5 second nature (lib/srs.ts intervals).
  const studied = vocabRows.filter((r) => (r.correct_count ?? 0) + (r.incorrect_count ?? 0) > 0);
  const inBox = (lo: number, hi: number) => studied.filter((r) => (r.box ?? 1) >= lo && (r.box ?? 1) <= hi).length;
  const bands: WordBand[] = [
    { label: tl("knownBox1"), count: inBox(1, 1), fill: "var(--tint-green)" },
    { label: tl("knownBox2"), count: inBox(2, 2), fill: "var(--c-success-line)" },
    { label: tl("knownBox3"), count: inBox(3, 3), fill: "var(--c-success)" },
    { label: tl("knownBox4"), count: inBox(4, 5), fill: "var(--c-success-deep)" },
  ];

  // The curve is reconstructed from when each word was first opened
  // (created_at) — the only per-word history the table keeps. It is
  // therefore "words started", counted cumulatively; box changes have no
  // log, so no line here pretends to know when a word became solid.
  const firstSeen = studied
    .map((r) => r.created_at)
    .filter((v): v is string => v != null)
    .sort();
  const curveStart = windowStart ?? (firstSeen[0] ? new Date(firstSeen[0]) : now);
  const before = firstSeen.filter((d) => new Date(d) < curveStart).length;
  const knownDelta = firstSeen.length - before;
  const STEPS = 12;
  const stepMs = Math.max(1, (now.getTime() - curveStart.getTime()) / STEPS);
  const series =
    firstSeen.length === 0
      ? []
      : Array.from({ length: STEPS + 1 }, (_, i) => {
          const at = curveStart.getTime() + stepMs * i;
          return firstSeen.filter((d) => new Date(d).getTime() <= at).length;
        });

  // ── what grew the tree ──────────────────────────────────────────────────
  const bySkill = new Map<string, number>();
  for (const r of xpRows) {
    const key = r.skill ?? "other";
    bySkill.set(key, (bySkill.get(key) ?? 0) + (r.points ?? 0));
  }
  const skillLabel = (key: string) => {
    if (key === "other") return tl("ledgerOther");
    if (key === "quest") return tl("ledgerQuest");
    // nav has a name for every practice skill; anything else prints its key.
    // next-intl doesn't throw on a missing key, so check rather than catch.
    return tn.has(key as Parameters<typeof tn.has>[0]) ? tn(key as Parameters<typeof tn>[0]) : key;
  };
  const LEDGER_ROWS = 6;
  const ledgerAll = [...bySkill.entries()]
    .filter(([, points]) => points > 0)
    .sort((a, b) => b[1] - a[1]);
  const ledgerHead = ledgerAll.slice(0, LEDGER_ROWS);
  const ledgerTail = ledgerAll.slice(LEDGER_ROWS);
  const tailPoints = ledgerTail.reduce((a, [, p]) => a + p, 0);
  const ledgerRows: LedgerRow[] = [
    ...ledgerHead.map(([key, points]) => ({ key, label: skillLabel(key), points })),
    ...(tailPoints > 0 ? [{ key: "rest", label: tl("ledgerOther"), points: tailPoints }] : []),
  ];
  const ledgerTotal = ledgerAll.reduce((a, [, p]) => a + p, 0);

  // ── study calendar (this year) ──────────────────────────────────────────
  const yearPrefix = `${now.getFullYear()}-`;
  const yearRows = activityRows.filter((r) => r.activity_date.startsWith(yearPrefix) && (r.minutes ?? 0) > 0);
  const yearMinutes = yearRows.reduce((a, r) => a + (r.minutes ?? 0), 0);
  const yearDays = yearRows.length;

  const hasVocab = vocabRows.length > 0;
  const hasAnything = hasVocab || totalMinutes > 0 || ledgerTotal > 0;

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar
          displayName={profile?.display_name ?? ""}
          email={user.email ?? ""}
          streakDays={streakDays}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] xl:pb-[60px]">

          <div className="max-w-[560px] flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2 mb-[18px]">
            <h1 className="font-bold text-[clamp(22px,5vw,26px)] tracking-[-0.02em]">
              {tn("myProgress")}
            </h1>
            {hasAnything && <PeriodTabs current={period} />}
          </div>

          {/* grid-cols-1 pins the track to minmax(0,1fr); a bare auto track
              grows to the widest card's max-content and overflows on mobile */}
          <div className="max-w-[560px] grid grid-cols-1 gap-3">
            {/* 1 · what the learner actually knows — the page's headline */}
            {hasVocab && (
              <KnownWords
                total={wordsLearned}
                delta={knownDelta}
                bands={bands}
                series={series}
                startLabel={format.dateTime(curveStart, { month: "short", day: "numeric" })}
                endLabel={tl("today")}
              />
            )}

            {/* 2 · the level the learner picked, and how much of it is done */}
            <LevelCard
              level={level}
              words={skillProgress.vocabulary}
              readings={skillProgress.reading}
              listening={skillProgress.listening}
            />

            {/* 3 · the tree's ledger: which skills paid for this period's growth */}
            {hasAnything && <TreeLedger rows={ledgerRows} total={ledgerTotal} />}

            {hasAnything && (
              <MonthlyGrass
                minutesByDate={minutesByDate}
                headline={[
                  { label: tl("yearDays"), value: String(yearDays) },
                  { label: tl("yearMinutes"), value: String(yearMinutes) },
                ]}
              />
            )}

            {/* nothing studied yet: one line instead of a stack of empty cards */}
            {!hasAnything && (
              <div className="border border-dashed border-dash rounded-[14px] bg-cream px-[22px] py-5 text-[13px] text-muted">
                {t("noStatsYet")}
              </div>
            )}

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
