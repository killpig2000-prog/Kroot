import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import AdminRail, { type RailGroup } from "@/components/admin/AdminRail";
import { BarList, DayBarChart, Funnel, Gauge, Panel, Pill, StackedBars, StatTile, TrendLines } from "@/components/admin/AdminCharts";
import type { CefrLevel } from "@/lib/tree";

// Owner-only dashboard: signups, activity, onboarding funnel, feature usage,
// system health. Anyone else (including logged-in users) gets a plain 404 so
// the page stays invisible. Admin-only surface — Korean throughout, unlike
// the rest of the app (see [[ui-language-english-first]]).
const ADMIN_EMAIL = "killpig2000@gmail.com";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const I18N_NAMESPACES = ["common", "nav", "onboarding", "vocabulary", "words", "ui", "listening"];
const I18N_LOCALES = ["ja", "zh-Hans", "vi", "es"] as const;

const SKILL_LABELS: Record<string, string> = {
  reading: "📰 읽기",
  writing: "✏️ 쓰기",
  listening: "🎧 듣기",
  speaking: "🎙️ 말하기",
  vocabulary: "🃏 단어",
  grammar: "📖 문법",
  pronunciation: "🔊 발음",
  hangul: "🔤 한글",
  slang: "💬 슬랭",
  quest: "🎯 데일리 퀘스트",
};

const GOAL_LABELS: Record<string, string> = {
  drama: "📺 K-드라마",
  kpop: "🎧 K-팝",
  travel: "✈️ 여행",
  work: "💼 직장/학업",
  family: "💛 가족·연인",
  curious: "🌱 그냥 궁금해서",
};

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function kst(at: string) {
  return new Date(at).toLocaleString("en-CA", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function adminClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Translation coverage — read straight off disk, not the DB. Compares every
// locale's key set against English's for each namespace request.ts actually
// registers (grammar.json exists on disk but isn't wired up yet — reported
// separately below, not silently folded into "critical").
// ---------------------------------------------------------------------------
function flattenKeys(o: unknown, prefix = ""): string[] {
  if (typeof o !== "object" || o === null) return [prefix];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => flattenKeys(v, prefix ? `${prefix}.${k}` : k));
}

// Loaded the same way src/i18n/request.ts loads message files — a dynamic
// `import()` with a template-literal path — so the Vercel build's file
// tracer actually bundles these JSON files for this route. A plain
// fs.readFileSync(dynamicPath) is NOT traced (only import() is), so it
// would work in `next dev` off the real filesystem and 404/ENOENT once
// deployed as a serverless function; this file already runs standalone in
// production for i18n, so the same pattern is proven to bundle correctly.
async function loadJsonNamespace(locale: string, ns: string): Promise<Record<string, unknown> | null> {
  try {
    const mod = await import(`../../../../messages/${locale}/${ns}.json`);
    return (mod.default ?? mod) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function loadCoverage() {
  return Promise.all(
    I18N_NAMESPACES.map(async (ns) => {
      const en = await loadJsonNamespace("en", ns);
      if (!en) return { ns, cells: I18N_LOCALES.map(() => ({ status: "critical" as const, pct: 0 })) };
      const enKeys = flattenKeys(en);
      const cells = await Promise.all(
        I18N_LOCALES.map(async (loc) => {
          const mod = await loadJsonNamespace(loc, ns);
          if (!mod) return { status: "critical" as const, pct: 0 };
          const keys = new Set(flattenKeys(mod));
          const have = enKeys.filter((k) => keys.has(k)).length;
          const pct = enKeys.length ? Math.round((have / enKeys.length) * 100) : 100;
          return { status: (pct >= 100 ? "good" : "warning") as "good" | "warning", pct };
        })
      );
      return { ns, cells };
    })
  );
}

// ---------------------------------------------------------------------------

async function loadStats() {
  const db = adminClient();
  const today = iso(new Date());
  const since30 = daysAgo(29).toISOString();
  const since30Day = iso(daysAgo(29));

  const [
    total,
    cohortRes,
    recentRes,
    activityRes,
    usageRes,
    eventsRes,
    onboardingEvents,
    placementQuestions,
    placementFinished,
    pushCountRes,
    dormantRes,
    streakRows,
    ...levelCounts
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id, created_at").gte("created_at", since30Day),
    db
      .from("profiles")
      .select("display_name, current_level, streak_days, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("daily_activity").select("user_id, activity_date, minutes").gte("activity_date", iso(daysAgo(29))),
    db.from("xp_events").select("skill, user_id, created_at").gte("created_at", since30).limit(20000),
    db
      .from("xp_events")
      .select("user_id, skill, points, created_at")
      .gte("created_at", daysAgo(6).toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    db
      .from("analytics_events")
      .select("event, props, created_at")
      .in("event", ["onboarding_completed", "placement_gate", "streak_freeze_bought", "pwa_installed", "writing_chapter_submitted"])
      .gte("created_at", since30)
      .limit(20000),
    db.from("analytics_events").select("props").eq("event", "placement_question").gte("created_at", since30).limit(20000),
    db.from("analytics_events").select("props").eq("event", "placement_finished").gte("created_at", since30).limit(20000),
    db.from("push_subscriptions").select("user_id", { count: "exact", head: true }),
    db
      .from("profiles")
      .select("display_name, current_level, streak_days, last_active_date")
      .not("last_active_date", "is", null)
      .lt("last_active_date", iso(daysAgo(13)))
      .gt("streak_days", 0)
      .order("last_active_date", { ascending: false })
      .limit(10),
    db.from("profiles").select("streak_days").gt("streak_days", 0),
    ...LEVELS.map((lvl) => db.from("profiles").select("id", { count: "exact", head: true }).eq("current_level", lvl)),
  ]);

  // Signups per day, last 30 days (oldest first)
  const cohortRows = cohortRes.data ?? [];
  const signupsByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) signupsByDay.set(iso(daysAgo(i)), 0);
  for (const row of cohortRows) {
    const day = row.created_at.slice(0, 10);
    if (signupsByDay.has(day)) signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
  }

  const activity = activityRes.data ?? [];
  const dauToday = new Set(activity.filter((a) => a.activity_date === today).map((a) => a.user_id)).size;
  const wau = new Set(activity.filter((a) => a.activity_date >= iso(daysAgo(6))).map((a) => a.user_id)).size;
  const minutes7d = activity
    .filter((a) => a.activity_date >= iso(daysAgo(6)))
    .reduce((sum, a) => sum + (a.minutes ?? 0), 0);

  // DAU/WAU trend, 30 days
  const activeByDay = new Map<string, Set<string>>();
  for (const a of activity) {
    if (!activeByDay.has(a.activity_date)) activeByDay.set(a.activity_date, new Set());
    activeByDay.get(a.activity_date)!.add(a.user_id);
  }
  const dauSeries: number[] = [];
  const wauSeries: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = iso(daysAgo(i));
    dauSeries.push(activeByDay.get(day)?.size ?? 0);
    const weekStart = iso(daysAgo(i + 6));
    const users = new Set<string>();
    for (const [d, set] of activeByDay) if (d >= weekStart && d <= day) for (const u of set) users.add(u);
    wauSeries.push(users.size);
  }

  // Feature usage (30d), skill-tagged xp_events
  const sevenDaysAgo = iso(daysAgo(6)) + "T00:00:00.000Z";
  const bySkill = new Map<string, { c7: number; u7: Set<string>; c30: number; u30: Set<string> }>();
  for (const ev of usageRes.data ?? []) {
    if (!ev.skill) continue;
    let e = bySkill.get(ev.skill);
    if (!e) {
      e = { c7: 0, u7: new Set(), c30: 0, u30: new Set() };
      bySkill.set(ev.skill, e);
    }
    e.c30 += 1;
    e.u30.add(ev.user_id);
    if (ev.created_at >= sevenDaysAgo) {
      e.c7 += 1;
      e.u7.add(ev.user_id);
    }
  }
  const usage = [...bySkill.entries()]
    .map(([skill, e]) => ({ label: SKILL_LABELS[skill] ?? skill, c7: e.c7, u7: e.u7.size, c30: e.c30, u30: e.u30.size }))
    .sort((a, b) => b.c30 - a.c30);

  // Onboarding: goal distribution, Hangul gate split, retention cohort
  const goalCounts = new Map<string, number>();
  let hangulYes = 0;
  let hangulNo = 0;
  let onboardingCompleted = 0;
  const writingModeRows = new Map<string, { tiles: number; slots: number; chunks: number; type: number; local: number; total: number; retries: number }>();
  let pwaInstalls = 0;
  let freezesBought = 0;
  for (const ev of onboardingEvents.data ?? []) {
    const p = ev.props as Record<string, unknown>;
    if (ev.event === "onboarding_completed") {
      onboardingCompleted++;
      const goal = typeof p.goal === "string" ? p.goal : null;
      if (goal) goalCounts.set(goal, (goalCounts.get(goal) ?? 0) + 1);
    } else if (ev.event === "placement_gate" && typeof p.can_read === "boolean") {
      if (p.can_read) hangulYes++;
      else hangulNo++;
    } else if (ev.event === "pwa_installed") {
      pwaInstalls++;
    } else if (ev.event === "streak_freeze_bought") {
      freezesBought++;
    } else if (ev.event === "writing_chapter_submitted") {
      const level = typeof p.level === "string" ? p.level : "?";
      let e = writingModeRows.get(level);
      if (!e) {
        e = { tiles: 0, slots: 0, chunks: 0, type: 0, local: 0, total: 0, retries: 0 };
        writingModeRows.set(level, e);
      }
      e.tiles += Number(p.tiles ?? 0);
      e.slots += Number(p.slots ?? 0);
      e.chunks += Number(p.chunks ?? 0);
      e.type += Number(p.type ?? 0);
      e.retries += Number(p.retries ?? 0);
      e.total += 1;
      if (p.graded_locally === true) e.local += 1;
    }
  }
  const goalDist = [...goalCounts.entries()].map(([g, v]) => ({ label: GOAL_LABELS[g] ?? g, value: v })).sort((a, b) => b.value - a.value);

  // Per-question timing, by band × type
  const bandTypeMs = new Map<string, { sum: number; n: number }>();
  for (const ev of placementQuestions.data ?? []) {
    const p = ev.props as Record<string, unknown>;
    const band = Number(p.band);
    const type = typeof p.type === "string" ? p.type : null;
    const ms = Number(p.ms);
    if (!band || !type || !Number.isFinite(ms)) continue;
    const key = `${band}:${type}`;
    const e = bandTypeMs.get(key) ?? { sum: 0, n: 0 };
    e.sum += ms;
    e.n += 1;
    bandTypeMs.set(key, e);
  }
  const stoppedAtCounts = new Map<string, number>();
  let finishedTotal = 0;
  for (const ev of placementFinished.data ?? []) {
    finishedTotal++;
    const p = ev.props as Record<string, unknown>;
    const s = typeof p.stopped_at === "string" ? p.stopped_at : null;
    if (s) stoppedAtCounts.set(s, (stoppedAtCounts.get(s) ?? 0) + 1);
  }
  const avgMs = (band: number, type: string) => {
    const e = bandTypeMs.get(`${band}:${type}`);
    return e && e.n ? Math.round(e.sum / e.n) : null;
  };
  const questionTiming = LEVELS.map((code, i) => ({
    band: code,
    words: avgMs(i + 1, "Words"),
    grammar: avgMs(i + 1, "Grammar"),
    listening: avgMs(i + 1, "Listening"),
    stoppedPct: finishedTotal ? Math.round(((stoppedAtCounts.get(code) ?? 0) / finishedTotal) * 100) : 0,
  }));

  // Retention: D1 / D7 return, over the last-30d signup cohort
  const activeDays = new Map<string, Set<string>>();
  for (const a of activity) {
    if (!activeDays.has(a.user_id)) activeDays.set(a.user_id, new Set());
    activeDays.get(a.user_id)!.add(a.activity_date);
  }
  let d1 = 0;
  let d7 = 0;
  let firstLesson = 0;
  for (const p of cohortRows) {
    const days = activeDays.get(p.id);
    const base = new Date(iso(new Date(p.created_at))).getTime();
    if (!days) continue;
    const offsets = [...days].map((d) => Math.round((new Date(d).getTime() - base) / 86_400_000));
    if (offsets.length) firstLesson++;
    if (offsets.includes(1)) d1++;
    if (offsets.some((o) => o >= 7 && o <= 13)) d7++;
  }

  // Who used what + recent feed (7d), same as before
  const events = (eventsRes.data ?? []) as { user_id: string; skill: string | null; points: number; created_at: string }[];
  const nameById = new Map<string, string>();
  const eventUserIds = [...new Set(events.map((e) => e.user_id))];
  if (eventUserIds.length > 0) {
    const { data: nameRows } = await db.from("profiles").select("id, display_name").in("id", eventUserIds);
    for (const p of nameRows ?? []) nameById.set(p.id, p.display_name);
  }
  const label = (skill: string | null) => (skill && SKILL_LABELS[skill]) || skill || "⭐ 기타";
  const feed = events.slice(0, 30).map((e) => ({ name: nameById.get(e.user_id) ?? "?", label: label(e.skill), points: e.points, at: e.created_at }));

  // Streak buckets
  const streakBuckets = [
    { label: "1일", min: 1, max: 1 },
    { label: "2–3일", min: 2, max: 3 },
    { label: "4–6일", min: 4, max: 6 },
    { label: "7–13일", min: 7, max: 13 },
    { label: "14–29일", min: 14, max: 29 },
    { label: "30일+", min: 30, max: Infinity },
  ].map((b) => ({
    label: b.label,
    value: (streakRows.data ?? []).filter((r) => r.streak_days >= b.min && r.streak_days <= b.max).length,
  }));

  // Reminder cron health, straight from profiles.last_reminded_at
  const reminderRows = (await db.from("profiles").select("last_reminded_at").not("last_reminded_at", "is", null)).data ?? [];
  const lastRemindedTimes = reminderRows.map((r) => r.last_reminded_at as string).sort();
  const lastRun = lastRemindedTimes.at(-1) ?? null;
  const sentToday = lastRemindedTimes.filter((t) => t.slice(0, 10) === today).length;

  const writingModes = LEVELS.map((code) => writingModeRows.get(code)).filter((v): v is NonNullable<typeof v> => !!v);
  const writingTotals = LEVELS.map((code) => {
    const e = writingModeRows.get(code);
    if (!e || e.total === 0) return null;
    const sum = e.tiles + e.slots + e.chunks + e.type || 1;
    return { label: code, values: [e.tiles / sum, e.slots / sum, e.chunks / sum, e.type / sum].map((v) => Math.round(v * 100)) };
  }).filter((v): v is NonNullable<typeof v> => !!v);
  const writingChapters = [...writingModeRows.values()];
  const gradedLocallyPct = writingChapters.length
    ? Math.round((writingChapters.reduce((s, e) => s + e.local, 0) / writingChapters.reduce((s, e) => s + e.total, 0)) * 100)
    : 0;
  const avgRetries = writingChapters.length
    ? (writingChapters.reduce((s, e) => s + e.retries, 0) / Math.max(1, writingChapters.reduce((s, e) => s + e.total, 0))).toFixed(1)
    : "0.0";

  return {
    totalUsers: total.count ?? 0,
    signupsToday: signupsByDay.get(today) ?? 0,
    signups30d: [...signupsByDay.values()].reduce((a, b) => a + b, 0),
    signupsByDay: [...signupsByDay.entries()].map(([day, value]) => ({ day: day.slice(5), value })),
    dauToday,
    wau,
    minutes7d,
    dauSeries,
    wauSeries,
    d1Pct: cohortRows.length ? Math.round((d1 / cohortRows.length) * 100) : 0,
    d7Pct: cohortRows.length ? Math.round((d7 / cohortRows.length) * 100) : 0,
    avgStreak: streakRows.data?.length ? (streakRows.data.reduce((s, r) => s + r.streak_days, 0) / streakRows.data.length).toFixed(1) : "0.0",
    recent: recentRes.data ?? [],
    byLevel: LEVELS.map((lvl, i) => ({ level: lvl, count: levelCounts[i].count ?? 0 })),
    usage,
    feed,
    funnel: [
      { label: "가입", hint: `최근 30일`, count: cohortRows.length },
      { label: "레벨 확정", hint: "온보딩 완료", count: Math.max(onboardingCompleted, firstLesson) },
      { label: "첫 레슨", hint: "활동 1건 이상", count: firstLesson },
      { label: "D1 재방문", hint: "다음날 접속", count: d1 },
      { label: "D7 재방문", hint: "7~13일차 접속", count: d7 },
    ],
    goalDist,
    hangulGate: { yes: hangulYes, no: hangulNo },
    questionTiming,
    streakBuckets,
    dormant: dormantRes.data ?? [],
    pushCount: pushCountRes.count ?? 0,
    pwaInstalls,
    freezesBought,
    writingTotals,
    gradedLocallyPct,
    avgRetries,
    hasWritingData: writingModes.length > 0,
    reminderLastRun: lastRun,
    reminderSentToday: sentToday,
    coverage: await loadCoverage(),
  };
}

const RAIL: RailGroup[] = [
  { items: [{ id: "overview", label: "개요", icon: "📊" }] },
  { items: [{ id: "onboarding", label: "온보딩", icon: "🚪" }] },
  { items: [{ id: "engagement", label: "참여/리텐션", icon: "🔥" }] },
  {
    label: "콘텐츠",
    items: [
      { id: "features", label: "기능별 사용량", icon: "🧩" },
      { id: "writing", label: "쓰기 모드", icon: "✏️" },
      { id: "locales", label: "번역 커버리지", icon: "🌐" },
    ],
  },
  { label: "운영", items: [{ id: "ops", label: "시스템 상태", icon: "⚙️" }] },
  { label: "유저", items: [{ id: "users", label: "유저", icon: "👤" }] },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) notFound();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold">관리자</h1>
        <p className="mt-4 rounded-xl bg-[var(--tint-amber)] p-4 text-sm text-amber">
          <code>SUPABASE_SERVICE_ROLE_KEY</code>가 이 환경에 설정되어 있지 않아 전체 유저 통계를 불러올 수 없습니다.
          <code>.env.local</code>에 추가해 주세요 (Vercel에는 이미 설정되어 있습니다).
        </p>
      </main>
    );
  }

  const s = await loadStats();

  return (
    <div className="flex min-h-screen bg-warm">
      <AdminRail groups={RAIL} />
      <main className="flex-1 min-w-0 px-7 py-[22px] pb-20 max-w-[1180px]">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-[22px]">
          <div>
            <h1 className="font-bold text-[23px] tracking-[-0.01em]">관리자</h1>
            <p className="text-[11.5px] text-faint">모든 시각은 KST 기준</p>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-success hover:underline">
            ← 대시보드로
          </Link>
        </div>

        {/* ===================== 개요 ===================== */}
        <section id="overview" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">개요</h2>
          <p className="text-[12px] text-faint mb-3.5">서비스가 살아있는지 한눈에 보는 지표</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3.5">
            <StatTile label="총 유저" value={s.totalUsers.toLocaleString()} sub={`이번달 +${s.signups30d}`} trend="up" />
            <StatTile label="오늘 가입" value={s.signupsToday} />
            <StatTile label="오늘 활성" value={s.dauToday} sub={`이번주 ${s.wau}명`} trend="up" />
            <StatTile label="7일 학습시간" value={`${s.minutes7d.toLocaleString()}분`} />
            <StatTile label="D7 리텐션" value={`${s.d7Pct}%`} sub="30일 코호트 기준" />
            <StatTile label="평균 스트릭" value={`${s.avgStreak}일`} sub="스트릭 보유자 기준" />
          </div>
          <Panel title="가입 추이 · 최근 30일">
            <DayBarChart data={s.signupsByDay} color="var(--c-sky-deep)" />
          </Panel>
        </section>

        {/* ===================== 온보딩 ===================== */}
        <section id="onboarding" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">온보딩 퍼널</h2>
          <p className="text-[12px] text-faint mb-3.5">레벨테스트 → 가입 → 첫 레슨, 최근 30일</p>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3.5">
            <Panel>
              <Funnel steps={s.funnel} />
            </Panel>
            <Panel title="목표(goal) 분포">
              <BarList rows={s.goalDist} color="var(--c-success)" />
              <p className="text-[11px] text-faint mt-3">
                한글 게이트: <b className="text-charcoal">{s.hangulGate.yes}</b>명 읽을 수 있음 ·{" "}
                <b className="text-charcoal">{s.hangulGate.no}</b>명 한글부터 시작
              </p>
            </Panel>
          </div>
          <Panel title="문항별 평균 소요시간" sub="밴드 × 유형, 새로 추가된 응답시간(ms) 트래킹 기반" >
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-[12px] min-w-[480px]">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-[.06em] text-faint">
                    <th className="pb-2">밴드</th>
                    <th className="pb-2 text-right">단어</th>
                    <th className="pb-2 text-right">문법</th>
                    <th className="pb-2 text-right">듣기</th>
                    <th className="pb-2 text-right">여기서 종료</th>
                  </tr>
                </thead>
                <tbody>
                  {s.questionTiming.map((r) => (
                    <tr key={r.band} className="border-t border-line">
                      <td className="py-1.5 font-mono font-bold">{r.band}</td>
                      <td className="py-1.5 text-right tabular-nums">{r.words != null ? `${(r.words / 1000).toFixed(1)}초` : "—"}</td>
                      <td className="py-1.5 text-right tabular-nums">{r.grammar != null ? `${(r.grammar / 1000).toFixed(1)}초` : "—"}</td>
                      <td className="py-1.5 text-right tabular-nums">{r.listening != null ? `${(r.listening / 1000).toFixed(1)}초` : "—"}</td>
                      <td className="py-1.5 text-right tabular-nums font-bold">{r.stoppedPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        {/* ===================== 참여/리텐션 ===================== */}
        <section id="engagement" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">참여 &amp; 리텐션</h2>
          <p className="text-[12px] text-faint mb-3.5">누가 돌아오고 있는지, 스트릭·리마인더 루프 상태</p>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3.5 mb-3.5">
            <Panel>
              <TrendLines
                series={[
                  { label: "DAU", color: "var(--c-sky-deep)", values: s.dauSeries },
                  { label: "WAU", color: "var(--c-teal)", values: s.wauSeries },
                ]}
              />
            </Panel>
            <Panel title="스트릭 분포">
              <BarList rows={s.streakBuckets} color="var(--c-success)" />
            </Panel>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3.5">
            <StatTile label="스트릭 프리즈 구매" value={s.freezesBought} sub="최근 30일" />
            <StatTile label="푸시 구독자" value={s.pushCount} />
            <StatTile label="PWA 설치" value={s.pwaInstalls} sub="최근 30일" />
          </div>
          <Panel title="휴면 유저" sub="예전엔 활발했는데 14일 이상 조용함 · 리마인더 대상">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-[.06em] text-faint">
                    <th className="pb-2">유저</th>
                    <th className="pb-2">레벨</th>
                    <th className="pb-2">최근 활동</th>
                    <th className="pb-2 text-right">최고 스트릭</th>
                  </tr>
                </thead>
                <tbody>
                  {s.dormant.map((u) => (
                    <tr key={u.display_name} className="border-t border-line">
                      <td className="py-1.5 font-bold">{u.display_name}</td>
                      <td className="py-1.5 font-mono">{u.current_level}</td>
                      <td className="py-1.5 text-muted">{u.last_active_date}</td>
                      <td className="py-1.5 text-right tabular-nums">{u.streak_days}일</td>
                    </tr>
                  ))}
                  {s.dormant.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-faint">
                        휴면 유저 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>

        {/* ===================== 기능별 사용량 ===================== */}
        <section id="features" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">기능별 사용량</h2>
          <p className="text-[12px] text-faint mb-3.5">스킬별 완료 건수 · 최근 30일</p>
          <Panel>
            <BarList rows={s.usage.map((u) => ({ label: u.label, value: u.c30, hint: `${u.c30.toLocaleString()} (유저 ${u.u30})` }))} />
          </Panel>
        </section>

        {/* ===================== 쓰기 모드 ===================== */}
        <section id="writing" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">쓰기(Writing) 모드</h2>
          <p className="text-[12px] text-faint mb-3.5">8/30 출시한 탭-조립 방식 채택 현황</p>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3.5">
            <Panel>
              {s.hasWritingData ? (
                <StackedBars
                  rows={s.writingTotals}
                  keys={["타일 조립", "빈칸 조립", "청크 작문", "직접 타이핑"]}
                  colors={["#2a78d6", "#eda100", "#1baf7a", "var(--c-faint)"]}
                />
              ) : (
                <p className="text-faint text-center py-8">아직 데이터가 쌓이는 중입니다 (writing_chapter_submitted 이벤트 신규 도입)</p>
              )}
            </Panel>
            <Panel title="채점 비용">
              <div className="text-[22px] font-extrabold tabular-nums mb-1.5">{s.gradedLocallyPct}%</div>
              <p className="text-[11px] text-faint mb-2">Gemini 호출 없이 로컬 채점된 챕터 비율</p>
              <Gauge pct={s.gradedLocallyPct} label="" />
              <p className="text-[11px] text-faint mt-3.5">
                체크 통과까지 평균 재시도: <b className="text-charcoal">{s.avgRetries}회</b>
              </p>
            </Panel>
          </div>
        </section>

        {/* ===================== 번역 커버리지 ===================== */}
        <section id="locales" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">번역 커버리지</h2>
          <p className="text-[12px] text-faint mb-3.5">영어(en) 키 기준, 네임스페이스별 번역 완성도 — 파일 시스템에서 직접 계산</p>
          <Panel>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-[.06em] text-faint">
                    <th className="pb-2">네임스페이스</th>
                    <th className="pb-2">ja</th>
                    <th className="pb-2">zh-Hans</th>
                    <th className="pb-2">vi</th>
                    <th className="pb-2">es</th>
                  </tr>
                </thead>
                <tbody>
                  {s.coverage.map((row) => (
                    <tr key={row.ns} className="border-t border-line">
                      <td className="py-2 font-mono font-bold">{row.ns}</td>
                      {row.cells.map((c, i) => (
                        <td key={i} className="py-2">
                          <Pill status={c.status}>{c.status === "good" ? "완료" : c.status === "warning" ? `${c.pct}%` : "없음"}</Pill>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-faint mt-3">
              writing / grammar 콘텐츠 UI는 아직 이 다국어 체계에 올라가 있지 않아(하드코딩 영어) 이 표에는 나오지 않습니다.
            </p>
          </Panel>
        </section>

        {/* ===================== 시스템 상태 ===================== */}
        <section id="ops" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">시스템 상태</h2>
          <p className="text-[12px] text-faint mb-3.5">
            배포 상태는 Vercel API 토큰이 없어 아직 못 붙였습니다 — 필요하면{" "}
            <a href="https://vercel.com/kroot2/kroot" target="_blank" rel="noreferrer" className="underline">
              Vercel 대시보드
            </a>
            에서 확인하세요.
          </p>
          <Panel title="리마인더 cron">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Pill status={s.reminderLastRun ? "good" : "warning"}>{s.reminderLastRun ? "정상 작동" : "발송 기록 없음"}</Pill>
              {s.reminderLastRun && <span className="text-[11px] text-faint font-mono">{kst(s.reminderLastRun)}</span>}
            </div>
            <div className="text-[22px] font-extrabold tabular-nums">{s.reminderSentToday}</div>
            <p className="text-[11px] text-faint">오늘 발송된 리마인더 수</p>
          </Panel>
        </section>

        {/* ===================== 유저 ===================== */}
        <section id="users" className="mb-[34px] scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">유저</h2>
          <p className="text-[12px] text-faint mb-3.5">최근 가입 &amp; 레벨 분포</p>
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-3.5">
            <Panel title="최근 가입">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-[10px] font-black uppercase tracking-[.06em] text-faint">
                      <th className="pb-2">이름</th>
                      <th className="pb-2">레벨</th>
                      <th className="pb-2">스트릭</th>
                      <th className="pb-2">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.recent.map((u) => (
                      <tr key={u.display_name + u.created_at} className="border-t border-line">
                        <td className="py-1.5 font-bold">{u.display_name}</td>
                        <td className="py-1.5 font-mono">{u.current_level}</td>
                        <td className="py-1.5 tabular-nums">{u.streak_days}일</td>
                        <td className="py-1.5 text-muted">{u.created_at.slice(0, 10)}</td>
                      </tr>
                    ))}
                    {s.recent.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-faint">
                          아직 유저 없음
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel title="레벨 분포">
              <BarList rows={s.byLevel.map((l) => ({ label: l.level, value: l.count }))} labelWidth={44} color="var(--c-success)" />
            </Panel>
          </div>
          <Panel title="최근 활동 피드" sub="최근 7일" >
            <ul className="mt-1 max-h-[400px] overflow-y-auto pr-1 divide-y divide-line">
              {s.feed.map((e, i) => (
                <li key={e.name + e.at + i} className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]">
                  <span className="truncate min-w-0">
                    <b>{e.name}</b> <span className="text-muted">{e.label}</span>{" "}
                    <span className="text-[11px] text-success-deep">+{e.points}</span>
                  </span>
                  <span className="text-[11px] text-faint whitespace-nowrap">{kst(e.at)}</span>
                </li>
              ))}
              {s.feed.length === 0 && <li className="py-4 text-center text-faint">활동 없음</li>}
            </ul>
          </Panel>
        </section>
      </main>
    </div>
  );
}
