import Link from "next/link";
import { redirect } from "next/navigation";
import BottomNav from "@/components/dashboard/BottomNav";
import Sidebar from "@/components/dashboard/Sidebar";
import { createClient, getClaimsUser } from "@/lib/supabase/server";
import { UNIT_ICONS, getChaptersForTopic, getUnitTitle, unlockedVocabTiers } from "@/lib/vocabulary";
import { LEVEL_ORDER, nextLevel, type CefrLevel } from "@/lib/tree";


function isCefrLevel(value: string | undefined): value is CefrLevel {
  return !!value && (LEVEL_ORDER as string[]).includes(value);
}

const TOPIC_KEY = "daily-life";

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const supabase = await createClient();
  const user = await getClaimsUser(supabase);

  if (!user) redirect("/onboarding");

  // select("*") stays valid whether or not migration 0022 (box columns) is applied.
  const [{ data: profile }, { data: progressRows }, sp] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, current_level, streak_days, avatar_url, xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("vocabulary_progress")
      .select("*")
      .eq("user_id", user.id)
      .not("last_reviewed_at", "is", null),
    searchParams,
  ]);

  const myLevel = (profile?.current_level ?? "A1") as CefrLevel;
  const reviewedKeys = new Set((progressRows ?? []).map((r) => r.word_key));
  // Words past their review date have "wilted" — units containing them show 💧.
  const now = new Date();
  const thirstyKeys = new Set(
    (progressRows ?? [])
      .filter((r) => r.next_review_at && new Date(r.next_review_at) <= now)
      .map((r) => r.word_key)
  );

  const unlockedTiers = unlockedVocabTiers(myLevel);

  const requested = isCefrLevel(sp.level) ? sp.level : myLevel;
  const level = unlockedTiers.has(requested) ? requested : myLevel;
  const next = nextLevel(level);

  const chapters = getChaptersForTopic(TOPIC_KEY, level);

  const units = chapters.map((words, i) => {
    const known = words.filter((w) => reviewedKeys.has(w.key)).length;
    const thirsty = words.filter((w) => thirstyKeys.has(w.key)).length;
    const status = known === 0 ? "not-started" : known < words.length ? "in-progress" : "done";
    return { index: i, words, known, thirsty, status };
  });
  const doneUnits = units.filter((u) => u.status === "done").length;

  // 120 flat unit rows were an endless scroll — group them into collapsible
  // sets of ten, with the set you're currently working through open.
  const GROUP_SIZE = 10;
  const groups: (typeof units)[] = [];
  for (let g = 0; g < units.length; g += GROUP_SIZE) groups.push(units.slice(g, g + GROUP_SIZE));
  const continueUnit = units.find((u) => u.status !== "done") ?? null;
  const openGroupIndex = continueUnit ? Math.floor(continueUnit.index / GROUP_SIZE) : -1;

  // The three level pills shown in the hero: previous · current · next.
  const levelIdx = LEVEL_ORDER.indexOf(level);
  const pillLevels = LEVEL_ORDER.slice(Math.max(0, levelIdx - 1), levelIdx + 2);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#18181B]">
      <div className="grid grid-cols-1 md:grid-cols-[clamp(200px,18%,280px)_minmax(0,1fr)] w-full min-h-screen">
        <Sidebar
          displayName={profile?.display_name ?? "there"}
          email={user.email ?? ""}
          streakDays={profile?.streak_days ?? 0}
          avatarUrl={profile?.avatar_url}
        />

        <main className="min-w-0 px-[clamp(18px,4vw,44px)] pt-6 pb-[100px] md:pb-[60px] max-w-[820px]">
          {/* breadcrumb */}
          <div className="flex gap-2 text-[13px] text-[#A19A8C] mb-[18px]">
            <Link href="/dashboard" className="hover:text-[#18181B] transition-colors">
              Garden
            </Link>
            <span>/</span>
            <b className="text-[#18181B] font-semibold">Vocabulary</b>
          </div>

          {/* growth-stage legend */}
          <div className="flex gap-4 flex-wrap mb-5 text-[13px] text-[#6B6560]">
            <span>🌰 Seed</span>
            <span>🌱 Sprout</span>
            <span>🌿 Rooting</span>
            <span>🌳 Settled</span>
          </div>

          {/* level hero */}
          <div className="border border-[#E3DDD0] rounded-[16px] px-6 py-6 mb-7 flex items-center gap-5 flex-wrap">
            <span className="w-[70px] h-[70px] rounded-[14px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[34px] flex-none">
              🪴
            </span>
            <div className="flex-1 min-w-[220px]">
              <h1 className="font-bold text-[22px] tracking-[-0.02em] mb-0.5">
                Level {level} vocabulary
              </h1>
              <p className="text-sm text-[#6B6560] mb-3">
                {next ? `Finish every unit to grow into ${next}` : "Top level — keep those roots strong"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-[300px] h-2 rounded-full bg-[#E3DDD0] overflow-hidden">
                  <i
                    className="not-italic block h-full rounded-full bg-[#16A34A] transition-all"
                    style={{ width: `${units.length ? (doneUnits / units.length) * 100 : 0}%` }}
                  />
                </div>
                <b className="text-[13.5px] font-bold flex-none">
                  {doneUnits}/{units.length} units
                </b>
              </div>
            </div>
            <div className="flex gap-1.5 flex-none">
              {pillLevels.map((lv) =>
                unlockedTiers.has(lv) ? (
                  <Link
                    key={lv}
                    href={`/vocabulary?level=${lv}`}
                    className={`rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold border transition-colors ${
                      lv === level
                        ? "bg-[#16A34A] border-[#16A34A] text-white"
                        : "bg-white border-[#E3DDD0] text-[#A19A8C] hover:border-[#A19A8C]"
                    }`}
                  >
                    {lv}
                  </Link>
                ) : (
                  <div
                    key={lv}
                    className="rounded-[10px] px-3.5 py-2 text-[13.5px] font-bold border bg-[#FAF7EF] border-[#E3DDD0] text-[#A19A8C] grayscale opacity-60 cursor-not-allowed select-none text-center leading-tight"
                  >
                    🔒 {lv}
                    <small className="block text-[10.5px] font-bold">promotion test</small>
                  </div>
                )
              )}
            </div>
          </div>

          {/* continue card: one obvious next step above the unit groups */}
          {continueUnit && (
            <Link
              href={`/vocabulary/${TOPIC_KEY}/session?chapter=${continueUnit.index}&level=${level}`}
              className="flex items-center gap-3.5 border-[1.5px] border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-5 py-4 mb-6 transition-all hover:-translate-y-0.5 group"
            >
              <span className="flex-none w-10 h-10 rounded-[10px] bg-white border border-[#BBF7D0] flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                ▶
              </span>
              <span className="flex-1 min-w-[170px]">
                <b className="block font-semibold text-sm text-[#15803D]">
                  Continue · {getUnitTitle(level, continueUnit.index)}
                </b>
                <span className="text-[13px] text-[#4D7C5F]">
                  {continueUnit.known}/{continueUnit.words.length} known — pick up where you left off
                </span>
              </span>
              <span className="text-[13px] font-semibold text-[#16A34A] transition-transform group-hover:translate-x-0.5">
                Start →
              </span>
            </Link>
          )}

          {/* units, grouped ten at a time */}
          <h2 className="font-bold text-[16px] tracking-[-0.01em] mb-3.5">Units in {level}</h2>
          <div className="grid gap-3 mb-7">
            {groups.map((group, gi) => {
              const first = group[0].index + 1;
              const last = group[group.length - 1].index + 1;
              const groupDone = group.filter((u) => u.status === "done").length;
              const groupThirsty = group.reduce((sum, u) => sum + u.thirsty, 0);
              return (
                <details
                  key={gi}
                  open={gi === openGroupIndex}
                  className="border border-[#E3DDD0] rounded-[14px] bg-white overflow-hidden"
                >
                  <summary className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden hover:bg-[#FAF7EF] transition-colors">
                    <b className="flex-1 font-bold text-[14.5px]">
                      Units {first}–{last}
                    </b>
                    {groupThirsty > 0 && (
                      <span className="text-[11.5px] font-semibold text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] rounded-full px-2.5 py-[2px]">
                        💧 {groupThirsty}
                      </span>
                    )}
                    <span className="flex-none flex items-center gap-2">
                      <span className="w-[74px] h-1.5 rounded-full bg-[#E3DDD0] overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-[#16A34A]"
                          style={{ width: `${(groupDone / group.length) * 100}%` }}
                        />
                      </span>
                      <small className="text-[12px] text-[#6B6560] font-semibold tabular-nums">
                        {groupDone}/{group.length}
                      </small>
                      <span className="text-[#A19A8C] text-[11px]">▾</span>
                    </span>
                  </summary>
                  <div className="grid gap-2.5 px-3.5 pb-3.5 pt-1 border-t border-dashed border-[#E3DDD0]">
                    {group.map((u) => {
                      const meta = UNIT_ICONS[u.index % UNIT_ICONS.length];
                      return (
                        <Link
                          key={u.index}
                          href={`/vocabulary/${TOPIC_KEY}/session?chapter=${u.index}&level=${level}`}
                          className="border border-[#E3DDD0] rounded-[12px] bg-white px-4 py-3 flex items-center gap-3.5 transition-all duration-150 hover:border-[#16A34A] hover:bg-[#F0FDF4] hover:-translate-y-0.5 group"
                        >
                          <span
                            className="w-[40px] h-[40px] rounded-[11px] flex items-center justify-center text-[19px] flex-none transition-transform group-hover:scale-110"
                            style={{ background: meta.bg }}
                          >
                            {meta.icon}
                          </span>
                          <span className="flex-1 min-w-0">
                            <b className="block font-bold text-[14.5px]">{getUnitTitle(level, u.index)}</b>
                            <small className="block text-[12.5px] text-[#6B6560]">
                              {u.words.length} word{u.words.length === 1 ? "" : "s"}
                            </small>
                          </span>
                          <span className="text-right flex-none">
                            <span
                              className={`inline-block text-[12px] font-semibold rounded-full border px-3 py-[3px] mb-1 ${
                                u.thirsty > 0
                                  ? "text-[#2563EB] bg-[#EFF6FF] border-[#BFDBFE]"
                                  : u.status === "done"
                                  ? "text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0]"
                                  : u.status === "in-progress"
                                  ? "text-[#D97706] bg-[#FFFBEB] border-[#FDE68A]"
                                  : "text-[#A19A8C] bg-[#FAF7EF] border-[#E3DDD0]"
                              }`}
                            >
                              {u.thirsty > 0
                                ? `💧 ${u.thirsty} thirsty`
                                : u.status === "done"
                                ? "Done"
                                : u.status === "in-progress"
                                ? "In progress"
                                : "Not started"}
                            </span>
                            <small className="block text-[12px] text-[#A19A8C]">
                              {u.known}/{u.words.length} known
                            </small>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>

          {/* grow banner */}
          <div className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-[14px] px-5 py-4 text-[13.5px] text-[#15803D] flex items-center gap-2.5">
            <span className="text-base">🌳</span>
            {next ? (
              <span>
                Complete all {units.length} units above to grow your tree into <b>{next}</b>.
              </span>
            ) : (
              <span>You&apos;ve reached the canopy — review any unit to keep it fresh.</span>
            )}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
