import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import AdminRail, { type RailGroup } from "@/components/admin/AdminRail";
import { BarList, DayBarChart, Panel, Pill, StatTile } from "@/components/admin/AdminCharts";
import type { CefrLevel } from "@/lib/tree";

// Owner-only dashboard: signups, activity, feature usage, feedback, system
// health. Anyone else (including logged-in users) gets a plain 404 so the
// page stays invisible. Admin-only surface — Korean throughout, unlike the
// rest of the app (see [[ui-language-english-first]]).

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

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

async function loadStats() {
  const db = adminClient();
  const today = iso(new Date());
  const since30 = daysAgo(29).toISOString();
  const since30Day = iso(daysAgo(29));

  // admin_overview() (migration 0047) replaces several separate reads: the
  // total and push counts, the six-query N+1 over LEVELS, the streak
  // histogram, and the reminder health check.
  const [overviewRes, cohortRes, recentRes, activityRes, usageRes, eventsRes] = await Promise.all([
    db.rpc("admin_overview", { p_today: today }),
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
  ]);

  // Shape of admin_overview()'s jsonb. Every field has a fallback: a failed
  // RPC should leave the page rendering zeros, not throw the admin out of it.
  const overview = (overviewRes.data ?? {}) as {
    total_users?: number;
    level_counts?: Record<string, number>;
    streak_buckets?: Record<string, number>;
    push_count?: number;
    reminders?: { last_run?: string | null; sent_today?: number };
  };

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

  // Retention: D7 return, over the last-30d signup cohort
  const activeDays = new Map<string, Set<string>>();
  for (const a of activity) {
    if (!activeDays.has(a.user_id)) activeDays.set(a.user_id, new Set());
    activeDays.get(a.user_id)!.add(a.activity_date);
  }
  let d7 = 0;
  for (const p of cohortRows) {
    const days = activeDays.get(p.id);
    const base = new Date(iso(new Date(p.created_at))).getTime();
    if (!days) continue;
    const offsets = [...days].map((d) => Math.round((new Date(d).getTime() - base) / 86_400_000));
    if (offsets.some((o) => o >= 7 && o <= 13)) d7++;
  }

  // Who used what + recent feed (7d)
  const events = (eventsRes.data ?? []) as { user_id: string; skill: string | null; points: number; created_at: string }[];
  const nameById = new Map<string, string>();
  const eventUserIds = [...new Set(events.map((e) => e.user_id))];
  if (eventUserIds.length > 0) {
    const { data: nameRows } = await db.from("profiles").select("id, display_name").in("id", eventUserIds);
    for (const p of nameRows ?? []) nameById.set(p.id, p.display_name);
  }
  const label = (skill: string | null) => (skill && SKILL_LABELS[skill]) || skill || "⭐ 기타";
  const feed = events.slice(0, 30).map((e) => ({ name: nameById.get(e.user_id) ?? "?", label: label(e.skill), points: e.points, at: e.created_at }));

  const buckets = overview.streak_buckets ?? {};

  // Reminder cron health, straight from profiles.last_reminded_at
  const lastRun = overview.reminders?.last_run ?? null;
  const sentToday = Number(overview.reminders?.sent_today ?? 0);

  return {
    totalUsers: Number(overview.total_users ?? 0),
    signupsToday: signupsByDay.get(today) ?? 0,
    signups30d: [...signupsByDay.values()].reduce((a, b) => a + b, 0),
    signupsByDay: [...signupsByDay.entries()].map(([day, value]) => ({ day: day.slice(5), value })),
    dauToday,
    wau,
    minutes7d,
    d7Pct: cohortRows.length ? Math.round((d7 / cohortRows.length) * 100) : 0,
    avgStreak: String(buckets.avg ?? "0.0"),
    recent: recentRes.data ?? [],
    byLevel: LEVELS.map((lvl) => ({ level: lvl, count: Number(overview.level_counts?.[lvl] ?? 0) })),
    usage,
    feed,
    reminderLastRun: lastRun,
    reminderSentToday: sentToday,
  };
}

// ---------------------------------------------------------------------------
// Feedback — the dashboard's bottom-right widget writes to `feedback`, whose
// RLS only lets authors read their own rows, so this goes through the
// service role. Newest first, with the author's display name and email so
// a note can be followed up on.
// ---------------------------------------------------------------------------
type FeedbackRow = { id: string; name: string; email: string; page: string | null; message: string; at: string };

async function loadFeedback(): Promise<{ rows: FeedbackRow[]; total: number; last7d: number }> {
  const db = adminClient();
  const [listRes, countRes, weekRes] = await Promise.all([
    db.from("feedback").select("id, user_id, message, page, created_at").order("created_at", { ascending: false }).limit(100),
    db.from("feedback").select("id", { count: "exact", head: true }),
    db.from("feedback").select("id", { count: "exact", head: true }).gte("created_at", daysAgo(6).toISOString()),
  ]);
  const raw = (listRes.data ?? []) as { id: string; user_id: string; message: string; page: string | null; created_at: string }[];
  const userIds = [...new Set(raw.map((r) => r.user_id))];
  const nameById = new Map<string, string>();
  const emailById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await db.from("profiles").select("id, display_name").in("id", userIds);
    for (const p of profiles ?? []) nameById.set(p.id, p.display_name);
    // Emails live in auth.users, one admin lookup each — bounded by the 100-row page above.
    const users = await Promise.all(userIds.map((id) => db.auth.admin.getUserById(id)));
    users.forEach((u, i) => {
      if (u.data.user?.email) emailById.set(userIds[i], u.data.user.email);
    });
  }
  return {
    rows: raw.map((r) => ({
      id: r.id,
      name: nameById.get(r.user_id) ?? "?",
      email: emailById.get(r.user_id) ?? "",
      page: r.page,
      message: r.message,
      at: r.created_at,
    })),
    total: countRes.count ?? 0,
    last7d: weekRes.count ?? 0,
  };
}

const RAIL: RailGroup[] = [
  { items: [{ id: "overview", label: "개요", icon: "📊" }] },
  { items: [{ id: "features", label: "기능별 사용량", icon: "🧩" }] },
  { label: "운영", items: [{ id: "ops", label: "시스템 상태", icon: "⚙️" }] },
  {
    label: "유저",
    items: [
      { id: "feedback", label: "피드백", icon: "💬" },
      { id: "users", label: "유저", icon: "👤" },
    ],
  },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user || !isAdminEmail(user.email)) notFound();

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

  const [s, fb] = await Promise.all([loadStats(), loadFeedback()]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-warm">
      <AdminRail groups={RAIL} />
      <main className="flex-1 min-w-0 px-4 sm:px-7 py-4 md:py-[22px] pb-20 max-w-[1180px]">
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
        <section id="overview" className="mb-[34px] scroll-mt-[56px] md:scroll-mt-[18px]">
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

        {/* ===================== 기능별 사용량 ===================== */}
        <section id="features" className="mb-[34px] scroll-mt-[56px] md:scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">기능별 사용량</h2>
          <p className="text-[12px] text-faint mb-3.5">스킬별 완료 건수 · 최근 30일</p>
          <Panel>
            <BarList rows={s.usage.map((u) => ({ label: u.label, value: u.c30, hint: `${u.c30.toLocaleString()} (유저 ${u.u30})` }))} />
          </Panel>
        </section>

        {/* ===================== 시스템 상태 ===================== */}
        <section id="ops" className="mb-[34px] scroll-mt-[56px] md:scroll-mt-[18px]">
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

        {/* ===================== 피드백 ===================== */}
        <section id="feedback" className="mb-[34px] scroll-mt-[56px] md:scroll-mt-[18px]">
          <h2 className="font-bold text-[16.5px] mb-0.5">피드백</h2>
          <p className="text-[12px] text-faint mb-3.5">대시보드 우측하단 위젯으로 들어온 메시지 · 최신순 100건</p>
          <div className="grid grid-cols-2 gap-3 mb-3.5 max-w-[420px]">
            <StatTile label="전체" value={fb.total.toLocaleString()} />
            <StatTile label="최근 7일" value={fb.last7d} />
          </div>
          <Panel>
            <ul className="divide-y divide-line">
              {fb.rows.map((r) => (
                <li key={r.id} className="py-3 first:pt-1 last:pb-1">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                    <span className="text-[12.5px] min-w-0 truncate">
                      <b>{r.name}</b>
                      {r.email && <span className="text-muted"> · {r.email}</span>}
                      {r.page && <span className="font-mono text-[11px] text-faint"> · {r.page}</span>}
                    </span>
                    <span className="text-[11px] text-faint whitespace-nowrap font-mono">{kst(r.at)}</span>
                  </div>
                  <p className="text-[13.5px] leading-[1.55] whitespace-pre-wrap break-words">{r.message}</p>
                </li>
              ))}
              {fb.rows.length === 0 && <li className="py-6 text-center text-faint">아직 받은 피드백 없음</li>}
            </ul>
          </Panel>
        </section>

        {/* ===================== 유저 ===================== */}
        <section id="users" className="mb-[34px] scroll-mt-[56px] md:scroll-mt-[18px]">
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
