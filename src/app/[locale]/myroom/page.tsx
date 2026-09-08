import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import TreeCard from "@/components/dashboard/TreeCard";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress } from "@/lib/level";
import { countSavedWords, getWordBankSlots } from "@/lib/word-bank";
import type { CefrLevel } from "@/lib/tree";

// My room — the learner's own things (2026-09-07 restructure, mockup screen
// 5): the full garden up top (tree, greeting bubble, avatar, growth stages —
// everything that used to be the dashboard hero), then one row each for the
// Shop, the wardrobe, the weekly Garden Fair, the word bank and Settings.
//
// Settings used to fold open in place at the bottom of this list. It is a
// page of its own now (/settings) — the same three controls were also
// reachable from the sidebar account menu, and one of the two copies was
// always the stale one.

export default async function MyRoomPage() {
  const tn = await getTranslations("nav");
  const t = await getTranslations("myroom");
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);
  if (!user) redirect("/onboarding");

  const [{ data: profile }, extrasRes, costumesRes, rankRes, savedCount, slots] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, xp, streak_days, avatar_url, coins")
      .eq("id", user.id)
      .single(),
    supabase.from("profiles").select("streak_freezes").eq("id", user.id).maybeSingle(),
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
    // Weekly fair rank (migration 0026 RPC). Absent row = no XP this week yet.
    supabase.rpc("get_my_weekly_rank"),
    countSavedWords(supabase, user.id),
    getWordBankSlots(supabase, user.id),
  ]);
  const extras = extrasRes.error ? null : extrasRes.data;
  const costumes = costumesRes.error ? [] : (costumesRes.data ?? []);
  const equippedIds = costumes.filter((c) => c.equipped).map((c) => c.costume_id);
  type RankRow = { rank: number | null };
  const rankRow = rankRes.error ? null : ((rankRes.data as RankRow[] | RankRow | null) ?? null);
  const rank = Array.isArray(rankRow) ? rankRow[0]?.rank ?? null : rankRow?.rank ?? null;

  const streakDays = profile?.streak_days ?? 0;
  const coins = profile?.coins ?? 0;
  const cefr = (profile?.current_level ?? "A1") as CefrLevel;
  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);

  const rows: { icon: string; label: string; sub: string; href: string }[] = [
    { icon: "🛍️", label: tn("shop"), sub: t("shopSub", { n: coins }), href: "/shop" },
    // the shop lists what you own inside each slot tab — no separate page
    { icon: "🎁", label: t("wardrobe"), sub: t("wardrobeSub", { n: costumes.length }), href: "/shop" },
    { icon: "🏅", label: t("fair"), sub: rank ? t("fairSub", { rank }) : t("fairNone"), href: "/ranking" },
    { icon: "📒", label: tn("myWords"), sub: t("bankSub", { n: savedCount, slots }), href: "/review/words" },
    { icon: "⚙️", label: t("settings"), sub: t("settingsSub"), href: "/settings" },
  ];

  // Row metrics are the restructure mockup's, scaled 1.45× from its 268px
  // phone frame to a real 390px one (2026-09-07 fidelity pass).
  const row = "flex items-center gap-[12px] border border-line bg-cream rounded-[20px] px-[16px] py-[12px] transition-all hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[.99] hover:border-success group";

  return (
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 xl:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen content-start xl:content-stretch">
        <Sidebar displayName={displayName} email={user.email ?? ""} streakDays={streakDays} avatarUrl={profile?.avatar_url} />

        {/* same padding as the dashboard so TreeCard's full-bleed negative
            margins line up with the header edge on phones */}
        <main className="min-w-0 px-[clamp(18px,3vw,36px)] pt-[24px] pb-[100px] xl:pb-[60px]">
          <TreeCard
            level={level}
            progressPct={pct}
            xpInto={into}
            xpNeeded={needed}
            costumeIds={equippedIds}
            species={cefr}
            userId={user.id}
            displayName={displayName}
            avatarUrl={profile?.avatar_url ?? null}
            coins={coins}
            streakDays={streakDays}
            streakFreezes={extras?.streak_freezes ?? 0}
            linkToShop
          />

          <div className="max-w-[560px] flex flex-col gap-[12px] mt-[12px]">
            {rows.map((r) => (
              <Link key={r.label} href={r.href} className={row}>
                <span className="flex-none text-[20px] transition-transform group-hover:scale-110" aria-hidden="true">
                  {r.icon}
                </span>
                <span className="flex-1 min-w-0 truncate text-[17px]">
                  <b className="font-bold text-charcoal">{r.label}</b>
                  <span className="text-[15px] text-muted"> · {r.sub}</span>
                </span>
                <span className="flex-none text-[15px] font-semibold text-success transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}

          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
