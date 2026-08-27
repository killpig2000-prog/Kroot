import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser, getDashboardProfile } from "@/lib/supabase/server";
import { LEVEL_ORDER, isCefrLevel, type CefrLevel } from "@/lib/tree";
import { isDifficultyUnlocked } from "@/lib/level";
import { SITUATIONS } from "@/lib/listening";
import { dialoguesFor } from "@/lib/listening-dialogues";
import { fetchUnsplashImage } from "@/lib/unsplash";

const SUBS: Record<string, string> = {
  cafe: "Ordering, menus, and small talk over coffee",
  restaurant: "Reserving tables and ordering real meals",
  airport: "Check-in, boarding, and customs phrases",
  shopping: "Sizes, prices, and asking for a discount",
  directions: "Finding your way around any city",
  hospital: "Symptoms, appointments, and the pharmacy",
  hotel: "Check-in, room requests, and amenities",
  phone: "Calls you'll actually have to make",
};

export default async function ListeningPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  const profile = await getDashboardProfile(supabase, user.id);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const sp = await searchParams;
  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = isDifficultyUnlocked(requested, myLevel) ? requested : myLevel;

  const [photos, { data: progressRows }] = await Promise.all([
    Promise.all(SITUATIONS.map((s) => fetchUnsplashImage(s.photoQuery))),
    supabase
      .from("listening_progress")
      .select("dialogue_id")
      .eq("user_id", user.id)
      .not("completed_at", "is", null),
  ]);
  const photoByKey = new Map(SITUATIONS.map((s, i) => [s.key, photos[i]]));
  const completedIds = new Set((progressRows ?? []).map((r) => r.dialogue_id));

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-faint mb-[18px]">
            <Link href="/dashboard" className="hover:text-charcoal transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-charcoal font-semibold">Listening</b>
          </div>

          {/* head */}
          <div className="flex items-center justify-between gap-4 mb-[18px] flex-wrap">
            <h1 className="font-bold text-[22px] tracking-[-0.02em] flex items-center">
              <span className="inline-flex w-[30px] h-[30px] rounded-lg bg-[#F0FDFA] text-teal border border-[#99F6E4] items-center justify-center kr text-[15px] mr-[9px]">
                듣
              </span>
              Listening
            </h1>
            <span className="text-[13px] text-muted">
              Pick a situation, listen, and follow the script
            </span>
          </div>

          {/* level tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {LEVEL_ORDER.map((lv) =>
              isDifficultyUnlocked(lv, myLevel) ? (
                <Link
                  key={lv}
                  href={`/listening?level=${lv}`}
                  className={`rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold transition-all border ${
                    lv === level
                      ? "bg-teal border-teal text-white"
                      : "bg-white border-line text-muted hover:border-faint"
                  }`}
                >
                  {lv}
                  {lv === myLevel && (
                    <span className="text-[10.5px] font-bold ml-1.5 opacity-85">· your level</span>
                  )}
                </Link>
              ) : (
                <div
                  key={lv}
                  className="rounded-[9px] px-[18px] py-2 text-[13.5px] font-semibold border bg-warm border-line text-faint grayscale opacity-60 cursor-not-allowed select-none"
                >
                  🔒 {lv}
                  <span className="text-[10.5px] font-bold ml-1.5">
                    · promotion test
                  </span>
                </div>
              )
            )}
          </div>

          {/* topic grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5 max-w-[980px]">
            {SITUATIONS.map((s) => {
              const dialogues = dialoguesFor(level, s.key);
              const count = dialogues.length;
              const done = dialogues.filter((d) => completedIds.has(d.id)).length;
              const photo = photoByKey.get(s.key);
              return (
                <Link
                  key={s.key}
                  href={`/listening/${s.key}?level=${level}`}
                  className="border border-line rounded-[14px] bg-white overflow-hidden text-left transition-all duration-150 hover:border-teal hover:bg-[#F0FDFA] hover:-translate-y-0.5 group"
                >
                  <div
                    className="relative aspect-[16/9] bg-warm"
                    style={
                      photo
                        ? { background: `url(${photo}) center/cover` }
                        : { background: s.bg }
                    }
                  >
                    <span className="absolute left-3 bottom-3 w-9 h-9 rounded-[10px] flex items-center justify-center text-lg bg-white/95 border border-line shadow-sm transition-transform group-hover:scale-110">
                      {s.icon}
                    </span>
                  </div>
                  <div className="px-[18px] py-4">
                    <b className="block font-semibold text-[15px] mb-0.5">{s.label}</b>
                    <small className="block text-[12.5px] text-muted leading-[1.5]">
                      {SUBS[s.key] ?? s.krLabel}
                    </small>
                    <span
                      className={`inline-block mt-3 text-[11.5px] font-semibold rounded-full px-2.5 py-[3px] border ${
                        done > 0 && done === count
                          ? "text-success bg-success-bg border-success-line"
                          : "text-teal bg-[#F0FDFA] border-[#99F6E4]"
                      }`}
                    >
                      {s.krLabel} ·{" "}
                      {count === 0
                        ? "coming soon"
                        : done === count
                          ? `all ${count} done ✓`
                          : done > 0
                            ? `${done}/${count} done`
                            : `${count} dialogue${count > 1 ? "s" : ""}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
