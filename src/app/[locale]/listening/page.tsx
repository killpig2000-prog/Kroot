import LevelTabs from "@/components/ui/LevelTabs";
import { Link, redirect } from "@/i18n/navigation";
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
    <div className="min-h-screen bg-warm text-charcoal">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(216px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
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

          <LevelTabs
            className="mb-6"
            levels={LEVEL_ORDER}
            current={level}
            mine={myLevel}
            unlocked={(lv) => isDifficultyUnlocked(lv, myLevel)}
            href={(lv) => `/listening?level=${lv}`}
            accent="bg-teal border-teal text-white"
          />

          {/* topic grid — two-up on phones so all eight situations fit in a
              couple of screens; the wider auto-fill grid from `sm` up. */}
          <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5 sm:gap-3.5 max-w-[980px]">
            {SITUATIONS.map((s) => {
              const dialogues = dialoguesFor(level, s.key);
              const count = dialogues.length;
              const done = dialogues.filter((d) => completedIds.has(d.id)).length;
              const finished = count > 0 && done === count;
              const inProgress = done > 0 && done < count;
              const next = inProgress ? (dialogues.find((d) => !completedIds.has(d.id)) ?? null) : null;
              const photo = photoByKey.get(s.key);
              // In-progress cards act as a "Continue" button: tap goes straight
              // to the next unheard clip. Not-started and finished cards still
              // open the clip list.
              const href = next
                ? `/listening/${s.key}/${next.id}`
                : `/listening/${s.key}?level=${level}`;
              return (
                <Link
                  key={s.key}
                  href={href}
                  className="border border-line rounded-[14px] bg-white overflow-hidden text-left transition-all duration-150 hover:border-teal hover:bg-[#F0FDFA] hover:-translate-y-0.5 group"
                >
                  <div
                    className="relative aspect-[4/3] sm:aspect-[16/9] bg-warm"
                    style={
                      photo
                        ? { background: `url(${photo}) center/cover` }
                        : { background: s.bg }
                    }
                  >
                    <span className="absolute left-2.5 bottom-2.5 sm:left-3 sm:bottom-3 w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] flex items-center justify-center text-base sm:text-lg bg-white/95 border border-line shadow-sm transition-transform group-hover:scale-110">
                      {s.icon}
                    </span>
                    {done > 0 && (
                      <span
                        className="absolute left-0 right-0 bottom-0 h-1 bg-white/55"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={count}
                        aria-valuenow={done}
                        aria-label={`${done} of ${count} heard`}
                      >
                        <span
                          className={`block h-full ${finished ? "bg-success" : "bg-teal"}`}
                          style={{ width: `${Math.round((done / count) * 100)}%` }}
                        />
                      </span>
                    )}
                  </div>
                  <div className="px-3 py-3 sm:px-[18px] sm:py-4">
                    <b className="block font-semibold text-[14px] sm:text-[15px] mb-0.5 truncate">{s.label}</b>
                    <small className="hidden sm:block text-[12.5px] text-muted leading-[1.5]">
                      {SUBS[s.key] ?? s.krLabel}
                    </small>
                    <span
                      className={`inline-block mt-2 sm:mt-3 max-w-full truncate text-[11px] sm:text-[11.5px] font-semibold rounded-full px-2 sm:px-2.5 py-[3px] border ${
                        done > 0 && done === count
                          ? "text-success bg-success-bg border-success-line"
                          : "text-teal bg-[#F0FDFA] border-[#99F6E4]"
                      }`}
                    >
                      <span className="kr">{s.krLabel}</span> ·{" "}
                      {count === 0
                        ? "coming soon"
                        : done === count
                          ? `all ${count} done ✓`
                          : done > 0
                            ? `${done}/${count} heard`
                            : `${count} dialogue${count > 1 ? "s" : ""}`}
                    </span>
                    {next ? (
                      <span className="mt-1.5 flex items-center gap-1.5 min-w-0 bg-[#F0FDFA] border border-[#99F6E4] rounded-[9px] px-2 py-1.5 text-[11px]">
                        <span
                          aria-hidden="true"
                          className="shrink-0 w-[18px] h-[18px] rounded-full bg-teal text-white flex items-center justify-center text-[8px] leading-none pl-px"
                        >
                          ▶
                        </span>
                        <span className="min-w-0 truncate text-charcoal">
                          Next · <span className="font-semibold">{next.title}</span>
                        </span>
                      </span>
                    ) : count > 0 ? (
                      <small className="block mt-1.5 text-[11.5px] text-muted truncate">
                        {finished ? "Replay any clip →" : "Start with clip 1 →"}
                      </small>
                    ) : null}
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
