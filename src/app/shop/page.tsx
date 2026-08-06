import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import BuyButton from "@/components/shop/BuyButton";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { COSTUMES } from "@/lib/costumes";
import { isPlus } from "@/lib/plus";

const SLOT_LABELS: Record<string, string> = { hat: "Hats", face: "Face", neck: "Neck" };

export default async function ShopPage() {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const [{ data: profile }, { data: ownedRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, coins, current_level, streak_days, avatar_url, plus_until")
      .eq("id", user.id)
      .single(),
    supabase.from("user_costumes").select("costume_id").eq("user_id", user.id),
  ]);
  const hasPlus = isPlus(profile?.plus_until);
  const ownedIds = new Set((ownedRows ?? []).map((r) => r.costume_id));

  const coins = profile?.coins ?? 0;
  const level = (profile?.current_level ?? "A1") as CefrLevel;
  const levelIdx = LEVEL_ORDER.indexOf(level);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Shop</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] items-center justify-center kr text-[15px] mr-[9px]">
                상
              </span>
              Costume Shop
            </h1>
            <span className="text-[12.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-full px-3 py-1">
              🌰 {coins} coins
            </span>
          </div>

          <p className="text-[13px] text-[#6B6560] mb-6">
            Dress up your tree. Earn coins by finishing daily quests, then equip outfits from your profile.
          </p>

          {!hasPlus && (
            <Link
              href="/pricing"
              className="flex items-center gap-3.5 border border-[#FDE68A] bg-[#FFFBEB] rounded-[14px] px-5 py-4 mb-6 max-w-[980px] transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#FDE68A] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                🌟
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#92400E]">Kroot Plus</b>
                <span className="text-[13px] text-[#A16207]">
                  Golden outfits, a Plus badge, and early access — while every lesson stays free.
                </span>
              </span>
              <span className="text-[13px] font-semibold text-[#D97706] transition-transform group-hover:translate-x-0.5">
                See plans →
              </span>
            </Link>
          )}

          {(["hat", "face", "neck"] as const).map((slot) => (
            <div key={slot} className="mb-7 max-w-[980px]">
              <p className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A19A8C] mb-3">
                {SLOT_LABELS[slot]}
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                {COSTUMES.filter((c) => c.slot === slot).map((c) => {
                  const locked = !!c.minLevel && LEVEL_ORDER.indexOf(c.minLevel) > levelIdx;
                  return (
                    <div
                      key={c.id}
                      className={`border border-[#E3DDD0] rounded-[14px] px-[18px] py-[18px] flex flex-col items-center text-center gap-2 transition-all duration-150 group ${
                        locked ? "bg-[#FAF7EF] opacity-70" : "bg-white hover:border-[#16A34A] hover:-translate-y-0.5"
                      }`}
                    >
                      <svg
                        viewBox="-40 -30 80 60"
                        className="w-[76px] h-[57px] transition-transform group-hover:scale-110"
                      >
                        {c.render()}
                      </svg>
                      <div>
                        <b className="block font-semibold text-sm">{c.name}</b>
                        <small className="block text-[12.5px] text-[#6B6560]">
                          <span className="kr">{c.krName}</span>
                          {c.minLevel ? ` · ${c.minLevel}+` : ""}
                          {c.plusOnly ? " · 🌟 Plus" : ""}
                        </small>
                      </div>
                      <BuyButton
                        costumeId={c.id}
                        price={c.price}
                        coins={coins}
                        owned={ownedIds.has(c.id)}
                        locked={locked}
                        plusLocked={!!c.plusOnly && !hasPlus}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
