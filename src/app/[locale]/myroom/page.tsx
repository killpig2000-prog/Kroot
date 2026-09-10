import { getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import MyRoomStage from "@/components/myroom/MyRoomStage";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { levelProgress, treeStageForLevel } from "@/lib/level";
import { countSavedWords, getWordBankSlots } from "@/lib/word-bank";
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

  const [{ data: profile }, extrasRes, costumesRes, savedCount, slots] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, xp, streak_days, avatar_url, coins, is_admin")
      .eq("id", user.id)
      .single(),
    supabase.from("profiles").select("streak_freezes").eq("id", user.id).maybeSingle(),
    supabase.from("user_costumes").select("costume_id, equipped").eq("user_id", user.id),
    countSavedWords(supabase, user.id),
    getWordBankSlots(supabase, user.id),
  ]);
  const extras = extrasRes.error ? null : extrasRes.data;
  const costumes = costumesRes.error ? [] : (costumesRes.data ?? []);
  const owned = costumes.map((c) => c.costume_id);
  const equipped = costumes.filter((c) => c.equipped).map((c) => c.costume_id);

  const streakDays = profile?.streak_days ?? 0;
  const coins = profile?.coins ?? 0;
  const cefr = (profile?.current_level ?? "A1") as CefrLevel;
  const displayName = profile?.display_name ?? "there";
  const { level, into, needed, pct } = levelProgress(profile?.xp ?? 0);
  const today = new Date().toISOString().slice(0, 10);

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
            }}
            shop={{
              isAdmin: profile?.is_admin ?? false,
              playerLevel: level,
              stage: treeStageForLevel(level),
              owned,
              equipped,
              today,
            }}
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
