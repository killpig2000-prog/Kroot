import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import MyRoomStage from "@/components/myroom/MyRoomStage";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress, treeStageForLevel } from "@/lib/level";
import { buildWeeks, ringsSince, xpByDayFrom } from "@/lib/growth-rings";
import { countSavedWords, getWordBankSlots } from "@/lib/word-bank";
import { dailyReviewCap } from "@/lib/srs";
import type { CefrLevel } from "@/lib/tree";

// My room — the dressing room (2026-09-10, mockup A). The garden up top is
// the learner's tree; the shop shelf right under it dresses that tree (tap
// a card, the tree wears it, Buy/Wear or Reset). One row for the word bank
// closes the page.
//
// Until today this page was the garden plus five equal rows: Shop, Wardrobe,
// Garden Fair, My word bank, Settings. Ranking and Settings are bottom tabs
// of their own now, and Wardrobe pointed at the same /shop as Shop — so the
// rows said three things the tab bar already says. /shop itself stays for
// the guided tour and the full catalog grid.

export default async function MyRoomPage() {
  const [tn, t] = await Promise.all([getTranslations("nav"), getTranslations("myroom")]);
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const now = new Date();
  const since = ringsSince(now);
  const [{ data: profile }, extrasRes, costumesRes, savedCount, slots, attendRes, activityRes, reviewRes, xpRes, dueRes, reviewedTodayRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, xp, streak_days, avatar_url, coins, is_admin, review_capacity_bonus")
      .eq("id", user.id)
      .single(),
    supabase.from("profiles").select("streak_freezes").eq("id", user.id).maybeSingle(),
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
    countSavedWords(supabase, user.id),
    getWordBankSlots(supabase, user.id),
    // Growth rings for the tree popup — the same three reads the Garden
    // makes, plus XP per day so a good week draws a thicker ring.
    supabase.from("attendance_days").select("day").eq("user_id", user.id).gte("day", since),
    supabase.from("daily_activity").select("activity_date, minutes").eq("user_id", user.id).gte("activity_date", since),
    supabase.from("vocabulary_progress").select("last_reviewed_at").eq("user_id", user.id).gte("last_reviewed_at", `${since}T00:00:00.000Z`),
    supabase.from("xp_events").select("points, created_at").eq("user_id", user.id).gte("created_at", `${since}T00:00:00.000Z`),
    // The watering can: the same due count and daily-cap accounting as the
    // Garden (dashboard_snapshot's due_count), so both gardens show one number.
    supabase.from("vocabulary_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).lte("next_review_at", now.toISOString()),
    supabase.from("vocabulary_progress").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("last_reviewed_at", `${now.toISOString().slice(0, 10)}T00:00:00.000Z`),
  ]);
  const reviewCap = dailyReviewCap(profile?.review_capacity_bonus ?? 0);
  const reviewDoneToday = (reviewedTodayRes.count ?? 0) >= reviewCap;
  // a failed read hides the can rather than showing "nothing due"
  const review = dueRes.error
    ? undefined
    : { due: reviewDoneToday ? 0 : Math.min(dueRes.count ?? 0, reviewCap), cap: reviewCap, doneToday: reviewDoneToday };
  const weeks = buildWeeks(now, {
    attended: new Set((attendRes.error ? [] : attendRes.data ?? []).map((r) => r.day as string)),
    studied: new Set((activityRes.error ? [] : activityRes.data ?? []).filter((r) => (r.minutes ?? 0) > 0).map((r) => r.activity_date as string)),
    reviewed: new Set((reviewRes.error ? [] : reviewRes.data ?? []).map((r) => String(r.last_reviewed_at).slice(0, 10))),
    xpByDay: xpByDayFrom(xpRes.error ? [] : (xpRes.data ?? [])),
  });
  const ringToday = (now.getDay() + 6) % 7;
  const extras = extrasRes.error ? null : extrasRes.data;
  const costumes = costumesRes.error ? [] : (costumesRes.data ?? []);
  const owned = costumes.map((c) => c.costume_id);
  const equipped = costumes.filter((c) => c.equipped).map((c) => c.costume_id);

  const streakDays = profile?.streak_days ?? 0;
  const coins = profile?.coins ?? 0;
  const cefr = (profile?.current_level ?? "A1") as CefrLevel;
  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);
  const today = now.toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar displayName={displayName} email={user.email ?? ""} streakDays={streakDays} avatarUrl={profile?.avatar_url} />

        {/* same padding as the dashboard so TreeCard's full-bleed negative
            margins line up with the header edge on phones */}
        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[24px] pb-[100px] xl:pb-[60px]">
          <MyRoomStage
            tree={{
              level,
              progressPct: pct,
              xpInto: into,
              xpNeeded: needed,
              species: cefr,
              userId: user.id,
              displayName,
              avatarUrl: profile?.avatar_url ?? null,
              coins,
              streakDays,
              streakFreezes: extras?.streak_freezes ?? 0,
              review,
            }}
            shop={{
              isAdmin: profile?.is_admin ?? false,
              playerLevel: level,
              stage: treeStageForLevel(level),
              owned,
              equipped,
              today,
            }}
            rings={{ weeks, today: ringToday }}
          />

          <div className="max-w-[560px] mt-4">
            <Link
              href="/review/words"
              className="flex items-center gap-[12px] border border-line bg-cream rounded-[12px] px-[16px] py-[12px] shadow-[0_2px_0_var(--c-line)] transition-all hover:border-success active:translate-y-[1px] active:shadow-none group"
            >
              <span className="flex-none text-[20px]" aria-hidden="true">
                📒
              </span>
              <span className="flex-1 min-w-0 truncate text-[16px]">
                <b className="font-bold text-charcoal">{tn("myWords")}</b>
                <span className="text-[14.5px] text-muted"> · {t("bankSub", { n: savedCount, slots })}</span>
              </span>
              <span className="flex-none text-[15px] font-semibold text-success transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                ›
              </span>
            </Link>
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
