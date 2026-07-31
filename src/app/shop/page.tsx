import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import BuyButton from "@/components/shop/BuyButton";
import { createClient } from "@/lib/supabase/server";
import { LEVEL_ORDER, type CefrLevel } from "@/lib/tree";
import { COSTUMES } from "@/lib/costumes";

const SLOT_LABELS: Record<string, string> = { hat: "Hats", face: "Face", neck: "Neck" };

export default async function ShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/onboarding");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, coins, current_level, streak_days, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: ownedRows } = await supabase.from("user_costumes").select("costume_id").eq("user_id", user.id);
  const ownedIds = new Set((ownedRows ?? []).map((r) => r.costume_id));

  const coins = profile?.coins ?? 0;
  const level = (profile?.current_level ?? "A1") as CefrLevel;
  const levelIdx = LEVEL_ORDER.indexOf(level);

  return (
    <div className="min-h-screen bg-white text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A1A1AA] mb-[18px]">
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

          <p className="text-[13px] text-[#71717A] mb-6">
            Dress up your tree. Earn coins by finishing daily quests, then equip outfits from your profile.
          </p>

          {(["hat", "face", "neck"] as const).map((slot) => (
            <div key={slot} className="mb-7 max-w-[980px]">
              <p className="text-[11.5px] font-semibold tracking-[.06em] uppercase text-[#A1A1AA] mb-3">
                {SLOT_LABELS[slot]}
              </p>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3.5">
                {COSTUMES.filter((c) => c.slot === slot).map((c) => {
                  const locked = !!c.minLevel && LEVEL_ORDER.indexOf(c.minLevel) > levelIdx;
                  return (
                    <div
                      key={c.id}
                      className={`border border-[#E7E5E4] rounded-[14px] px-[18px] py-[18px] flex flex-col items-center text-center gap-2 transition-all duration-150 group ${
                        locked ? "bg-[#FAFAF9] opacity-70" : "bg-white hover:border-[#16A34A] hover:-translate-y-0.5"
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
                        <small className="block text-[12.5px] text-[#71717A]">
                          <span className="kr">{c.krName}</span>
                          {c.minLevel ? ` · ${c.minLevel}+` : ""}
                        </small>
                      </div>
                      <BuyButton
                        costumeId={c.id}
                        price={c.price}
                        coins={coins}
                        owned={ownedIds.has(c.id)}
                        locked={locked}
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
